"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  getUserScheduleStorageKey,
  loadLocalScheduleItems,
  migrateScheduleItems,
  saveLocalScheduleItems,
  sortScheduleItems,
} from "../lib/gradeglowSchedule";
import type { AppUser, SyncStatus, UniScheduleItem } from "../types";

const SCHEDULE_COLLECTION_NAME = "schedule";
const SAVE_DEBOUNCE_MS = 350;

const serializeSchedule = (items: UniScheduleItem[]) => JSON.stringify(sortScheduleItems(items));
const serializeScheduleItem = (item: UniScheduleItem) => JSON.stringify(item);

type UseGradeGlowScheduleResult = {
  scheduleItems: UniScheduleItem[];
  setScheduleItems: Dispatch<SetStateAction<UniScheduleItem[]>>;
  isLoaded: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
};

export function useGradeGlowSchedule(user: AppUser): UseGradeGlowScheduleResult {
  const [scheduleState, setScheduleState] = useState<UniScheduleItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncMessage, setSyncMessage] = useState("Stundenplan lokal aktiv");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedScheduleRef = useRef<UniScheduleItem[]>([]);
  const pendingLocalScheduleJsonRef = useRef("");
  const storageKey = getUserScheduleStorageKey(user.uid);
  const shouldUseCloudSync = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  useEffect(() => {
    setIsLoaded(false);
    setScheduleState([]);
    lastPersistedScheduleRef.current = [];
    pendingLocalScheduleJsonRef.current = "";

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!shouldUseCloudSync || !db) {
      const localSchedule = loadLocalScheduleItems(storageKey);
      setScheduleState(localSchedule);
      lastPersistedScheduleRef.current = localSchedule;
      setSyncStatus("local");
      setSyncMessage("Stundenplan lokal gespeichert");
      setIsLoaded(true);
      return undefined;
    }

    const localBackup = loadLocalScheduleItems(storageKey);
    if (localBackup.length > 0) {
      setScheduleState(localBackup);
      lastPersistedScheduleRef.current = localBackup;
      setSyncStatus("cloud-loading");
      setSyncMessage("Lokales Stundenplan-Backup geladen · prüfe Cloud…");
      setIsLoaded(true);
    }

    const firestore = db;
    const scheduleCollectionRef = collection(firestore, "users", user.uid, SCHEDULE_COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      scheduleCollectionRef,
      (snapshot) => {
        const cloudSchedule = migrateScheduleItems(
          snapshot.docs.map((scheduleDoc) => ({ id: scheduleDoc.id, ...scheduleDoc.data() })),
        );
        const cloudScheduleJson = serializeSchedule(cloudSchedule);

        if (
          pendingLocalScheduleJsonRef.current &&
          pendingLocalScheduleJsonRef.current !== cloudScheduleJson
        ) {
          return;
        }

        pendingLocalScheduleJsonRef.current = "";
        lastPersistedScheduleRef.current = cloudSchedule;
        saveLocalScheduleItems(storageKey, cloudSchedule);
        setScheduleState(cloudSchedule);
        setSyncStatus(snapshot.empty ? "cloud-ready" : "cloud-saved");
        setSyncMessage(snapshot.empty ? "Stundenplan Cloud bereit" : "Stundenplan Cloud gespeichert");
        setIsLoaded(true);
      },
      () => {
        const localSchedule = loadLocalScheduleItems(storageKey);
        lastPersistedScheduleRef.current = localSchedule;
        setScheduleState(localSchedule);
        setSyncStatus("cloud-error");
        setSyncMessage("Stundenplan Cloud nicht erreichbar · lokal aktiv");
        setIsLoaded(true);
      },
    );

    return () => unsubscribe();
  }, [shouldUseCloudSync, storageKey, user.uid]);

  const persistSchedule = useCallback(
    (nextSchedule: UniScheduleItem[]) => {
      const sortedSchedule = sortScheduleItems(nextSchedule);
      const nextScheduleJson = serializeSchedule(sortedSchedule);
      saveLocalScheduleItems(storageKey, sortedSchedule);

      if (!shouldUseCloudSync || !db) {
        lastPersistedScheduleRef.current = sortedSchedule;
        setSyncStatus("local");
        setSyncMessage("Stundenplan lokal gespeichert");
        return;
      }

      const firestore = db;
      const previousSchedule = lastPersistedScheduleRef.current;
      const scheduleCollectionRef = collection(firestore, "users", user.uid, SCHEDULE_COLLECTION_NAME);

      pendingLocalScheduleJsonRef.current = nextScheduleJson;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSyncStatus("cloud-saving");
      setSyncMessage("Speichere Stundenplan…");

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const previousScheduleMap = new Map(previousSchedule.map((item) => [item.id, item]));
          const nextScheduleMap = new Map(sortedSchedule.map((item) => [item.id, item]));
          const batch = writeBatch(firestore);
          let operationCount = 0;

          sortedSchedule.forEach((item) => {
            const previousItem = previousScheduleMap.get(item.id);
            const itemChanged = !previousItem || serializeScheduleItem(previousItem) !== serializeScheduleItem(item);
            if (!itemChanged) return;

            batch.set(
              doc(scheduleCollectionRef, item.id),
              {
                ...item,
                ownerUid: user.uid,
                version: 1,
                ...(previousItem ? {} : { createdAt: serverTimestamp() }),
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
            operationCount += 1;
          });

          previousSchedule.forEach((item) => {
            if (nextScheduleMap.has(item.id)) return;
            batch.delete(doc(scheduleCollectionRef, item.id));
            operationCount += 1;
          });

          if (operationCount > 0) await batch.commit();

          lastPersistedScheduleRef.current = sortedSchedule;
          pendingLocalScheduleJsonRef.current = "";
          setSyncStatus("cloud-saved");
          setSyncMessage("Stundenplan Cloud gespeichert");
        } catch {
          setSyncStatus("cloud-error");
          setSyncMessage("Stundenplan Cloud-Fehler · lokales Backup aktiv");
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [shouldUseCloudSync, storageKey, user.uid],
  );

  const setScheduleItems = useCallback<Dispatch<SetStateAction<UniScheduleItem[]>>>(
    (action) => {
      setScheduleState((currentSchedule) => {
        const nextSchedule =
          typeof action === "function"
            ? (action as (currentSchedule: UniScheduleItem[]) => UniScheduleItem[])(currentSchedule)
            : action;

        const sortedSchedule = sortScheduleItems(nextSchedule);
        persistSchedule(sortedSchedule);
        return sortedSchedule;
      });
    },
    [persistSchedule],
  );

  return {
    scheduleItems: scheduleState,
    setScheduleItems,
    isLoaded,
    syncStatus,
    syncMessage,
  };
}
