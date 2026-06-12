"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  getUserModulesStorageKey,
  loadLocalModules,
  migrateModules,
  saveLocalModules,
} from "../lib/gradeglowModules";
import type { AppUser, SyncStatus, UniModule } from "../types";

const MODULE_COLLECTION_NAME = "modules";
const LEGACY_DASHBOARD_DOC_PATH = ["gradeglow", "dashboard"] as const;
const SAVE_DEBOUNCE_MS = 600;

const serializeModules = (modules: UniModule[]) => JSON.stringify(modules);

const serializeModule = (module: UniModule) => JSON.stringify(module);

type UseGradeGlowModulesResult = {
  modules: UniModule[];
  setModules: Dispatch<SetStateAction<UniModule[]>>;
  isLoaded: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  dataModel: "local-array" | "firestore-module-docs";
};

export function useGradeGlowModules(user: AppUser): UseGradeGlowModulesResult {
  const [modulesState, setModulesState] = useState<UniModule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncMessage, setSyncMessage] = useState("Lokaler Speicher aktiv");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedModulesRef = useRef<UniModule[]>([]);
  const pendingLocalModulesJsonRef = useRef("");
  const storageKey = getUserModulesStorageKey(user.uid);
  const shouldUseCloudSync = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  useEffect(() => {
    setIsLoaded(false);
    setModulesState([]);
    lastPersistedModulesRef.current = [];
    pendingLocalModulesJsonRef.current = "";

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!shouldUseCloudSync || !db) {
      const localModules = loadLocalModules(storageKey);
      setModulesState(localModules);
      lastPersistedModulesRef.current = localModules;
      setSyncStatus("local");
      setSyncMessage("Lokal pro Account gespeichert");
      setIsLoaded(true);
      return undefined;
    }

    let didCancel = false;
    let unsubscribe: (() => void) | undefined;

    const firestore = db;
    const modulesCollectionRef = collection(firestore, "users", user.uid, MODULE_COLLECTION_NAME);
    const legacyDashboardRef = doc(firestore, "users", user.uid, ...LEGACY_DASHBOARD_DOC_PATH);

    const migrateLegacyDataIfNeeded = async () => {
      const existingModulesSnapshot = await getDocs(modulesCollectionRef);
      if (!existingModulesSnapshot.empty) return;

      const legacyDashboardSnapshot = await getDoc(legacyDashboardRef);
      const legacyModules = legacyDashboardSnapshot.exists()
        ? migrateModules(legacyDashboardSnapshot.data().modules)
        : [];
      const localModules = loadLocalModules(storageKey);
      const modulesToMigrate = legacyModules.length > 0 ? legacyModules : localModules;

      if (modulesToMigrate.length === 0) return;

      const batch = writeBatch(firestore);

      modulesToMigrate.forEach((module) => {
        const moduleRef = doc(modulesCollectionRef, module.id);
        batch.set(
          moduleRef,
          {
            ...module,
            ownerUid: user.uid,
            version: 2,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      batch.set(
        legacyDashboardRef,
        {
          migratedToModuleDocs: true,
          migratedAt: serverTimestamp(),
          migratedModuleCount: modulesToMigrate.length,
        },
        { merge: true }
      );

      await batch.commit();
    };

    const startCloudSync = async () => {
      setSyncStatus("cloud-loading");
      setSyncMessage("Module werden einzeln geladen…");

      try {
        await migrateLegacyDataIfNeeded();

        if (didCancel) return;

        unsubscribe = onSnapshot(
          modulesCollectionRef,
          (snapshot) => {
            if (didCancel) return;

            const cloudModules = migrateModules(
              snapshot.docs.map((moduleDoc) => ({ id: moduleDoc.id, ...moduleDoc.data() }))
            );
            const cloudModulesJson = serializeModules(cloudModules);

            if (
              pendingLocalModulesJsonRef.current &&
              pendingLocalModulesJsonRef.current !== cloudModulesJson
            ) {
              return;
            }

            pendingLocalModulesJsonRef.current = "";
            lastPersistedModulesRef.current = cloudModules;
            saveLocalModules(storageKey, cloudModules);
            setModulesState(cloudModules);
            setSyncStatus(snapshot.empty ? "cloud-ready" : "cloud-saved");
            setSyncMessage(
              snapshot.empty
                ? "Cloud-Sync aktiv · einzelne Modul-Dokumente"
                : "Cloud gespeichert · einzelne Modul-Dokumente"
            );
            setIsLoaded(true);
          },
          () => {
            if (didCancel) return;

            const localModules = loadLocalModules(storageKey);
            lastPersistedModulesRef.current = localModules;
            setModulesState(localModules);
            setSyncStatus("cloud-error");
            setSyncMessage("Cloud nicht erreichbar · lokales Backup aktiv");
            setIsLoaded(true);
          }
        );
      } catch {
        if (didCancel) return;

        const localModules = loadLocalModules(storageKey);
        lastPersistedModulesRef.current = localModules;
        setModulesState(localModules);
        setSyncStatus("cloud-error");
        setSyncMessage("Cloud-Migration fehlgeschlagen · lokales Backup aktiv");
        setIsLoaded(true);
      }
    };

    void startCloudSync();

    return () => {
      didCancel = true;
      unsubscribe?.();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [shouldUseCloudSync, storageKey, user.uid]);

  const persistModules = useCallback(
    (nextModules: UniModule[]) => {
      const nextModulesJson = serializeModules(nextModules);

      saveLocalModules(storageKey, nextModules);

      if (!shouldUseCloudSync || !db) {
        lastPersistedModulesRef.current = nextModules;
        setSyncStatus("local");
        setSyncMessage("Lokal pro Account gespeichert");
        return;
      }

      const firestore = db;
      const previousModules = lastPersistedModulesRef.current;
      const modulesCollectionRef = collection(firestore, "users", user.uid, MODULE_COLLECTION_NAME);

      pendingLocalModulesJsonRef.current = nextModulesJson;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSyncStatus("cloud-saving");
      setSyncMessage("Speichere Modul-Dokumente…");

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const previousModuleMap = new Map(previousModules.map((module) => [module.id, module]));
          const nextModuleMap = new Map(nextModules.map((module) => [module.id, module]));
          const batch = writeBatch(firestore);
          let operationCount = 0;

          nextModules.forEach((module) => {
            const previousModule = previousModuleMap.get(module.id);
            const moduleChanged = !previousModule || serializeModule(previousModule) !== serializeModule(module);

            if (!moduleChanged) return;

            const moduleRef = doc(modulesCollectionRef, module.id);
            batch.set(
              moduleRef,
              {
                ...module,
                ownerUid: user.uid,
                version: 2,
                ...(previousModule ? {} : { createdAt: serverTimestamp() }),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            operationCount += 1;
          });

          previousModules.forEach((module) => {
            if (nextModuleMap.has(module.id)) return;
            batch.delete(doc(modulesCollectionRef, module.id));
            operationCount += 1;
          });

          if (operationCount > 0) {
            await batch.commit();
          }

          lastPersistedModulesRef.current = nextModules;
          pendingLocalModulesJsonRef.current = "";
          setSyncStatus("cloud-saved");
          setSyncMessage("Cloud gespeichert · einzelne Modul-Dokumente");
        } catch {
          setSyncStatus("cloud-error");
          setSyncMessage("Cloud-Speichern fehlgeschlagen · lokales Backup aktiv");
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [shouldUseCloudSync, storageKey, user.uid]
  );

  const setModules = useCallback<Dispatch<SetStateAction<UniModule[]>>>(
    (action) => {
      setModulesState((currentModules) => {
        const nextModules =
          typeof action === "function"
            ? (action as (currentModules: UniModule[]) => UniModule[])(currentModules)
            : action;

        persistModules(nextModules);
        return nextModules;
      });
    },
    [persistModules]
  );

  return {
    modules: modulesState,
    setModules,
    isLoaded,
    syncStatus,
    syncMessage,
    dataModel: shouldUseCloudSync ? "firestore-module-docs" : "local-array",
  };
}
