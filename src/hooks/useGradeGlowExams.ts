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
  getUserExamsStorageKey,
  loadLocalExams,
  migrateExams,
  saveLocalExams,
} from "../lib/gradeglowExams";
import type { AppUser, ExamPlanItem, SyncStatus } from "../types";

const EXAM_COLLECTION_NAME = "exams";
const SAVE_DEBOUNCE_MS = 600;

const serializeExams = (exams: ExamPlanItem[]) => JSON.stringify(exams);
const serializeExam = (exam: ExamPlanItem) => JSON.stringify(exam);

type UseGradeGlowExamsResult = {
  exams: ExamPlanItem[];
  setExams: Dispatch<SetStateAction<ExamPlanItem[]>>;
  isLoaded: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
};

export function useGradeGlowExams(user: AppUser): UseGradeGlowExamsResult {
  const [examsState, setExamsState] = useState<ExamPlanItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncMessage, setSyncMessage] = useState("Prüfungsplan lokal aktiv");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedExamsRef = useRef<ExamPlanItem[]>([]);
  const pendingLocalExamsJsonRef = useRef("");
  const storageKey = getUserExamsStorageKey(user.uid);
  const shouldUseCloudSync = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  useEffect(() => {
    setIsLoaded(false);
    setExamsState([]);
    lastPersistedExamsRef.current = [];
    pendingLocalExamsJsonRef.current = "";

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!shouldUseCloudSync || !db) {
      const localExams = loadLocalExams(storageKey);
      setExamsState(localExams);
      lastPersistedExamsRef.current = localExams;
      setSyncStatus("local");
      setSyncMessage("Prüfungsplan lokal gespeichert");
      setIsLoaded(true);
      return undefined;
    }

    const firestore = db;
    const examsCollectionRef = collection(firestore, "users", user.uid, EXAM_COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      examsCollectionRef,
      (snapshot) => {
        const cloudExams = migrateExams(
          snapshot.docs.map((examDoc) => ({ id: examDoc.id, ...examDoc.data() }))
        );
        const cloudExamsJson = serializeExams(cloudExams);

        if (
          pendingLocalExamsJsonRef.current &&
          pendingLocalExamsJsonRef.current !== cloudExamsJson
        ) {
          return;
        }

        pendingLocalExamsJsonRef.current = "";
        lastPersistedExamsRef.current = cloudExams;
        saveLocalExams(storageKey, cloudExams);
        setExamsState(cloudExams);
        setSyncStatus(snapshot.empty ? "cloud-ready" : "cloud-saved");
        setSyncMessage(
          snapshot.empty
            ? "Prüfungsplan Cloud bereit"
            : "Prüfungsplan Cloud gespeichert"
        );
        setIsLoaded(true);
      },
      () => {
        const localExams = loadLocalExams(storageKey);
        lastPersistedExamsRef.current = localExams;
        setExamsState(localExams);
        setSyncStatus("cloud-error");
        setSyncMessage("Prüfungsplan Cloud nicht erreichbar · lokal aktiv");
        setIsLoaded(true);
      }
    );

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [shouldUseCloudSync, storageKey, user.uid]);

  const persistExams = useCallback(
    (nextExams: ExamPlanItem[]) => {
      const nextExamsJson = serializeExams(nextExams);
      saveLocalExams(storageKey, nextExams);

      if (!shouldUseCloudSync || !db) {
        lastPersistedExamsRef.current = nextExams;
        setSyncStatus("local");
        setSyncMessage("Prüfungsplan lokal gespeichert");
        return;
      }

      const firestore = db;
      const previousExams = lastPersistedExamsRef.current;
      const examsCollectionRef = collection(firestore, "users", user.uid, EXAM_COLLECTION_NAME);

      pendingLocalExamsJsonRef.current = nextExamsJson;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSyncStatus("cloud-saving");
      setSyncMessage("Speichere Prüfungsplan…");

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const previousExamMap = new Map(previousExams.map((exam) => [exam.id, exam]));
          const nextExamMap = new Map(nextExams.map((exam) => [exam.id, exam]));
          const batch = writeBatch(firestore);
          let operationCount = 0;

          nextExams.forEach((exam) => {
            const previousExam = previousExamMap.get(exam.id);
            const examChanged = !previousExam || serializeExam(previousExam) !== serializeExam(exam);
            if (!examChanged) return;

            batch.set(
              doc(examsCollectionRef, exam.id),
              {
                ...exam,
                ownerUid: user.uid,
                version: 1,
                ...(previousExam ? {} : { createdAt: serverTimestamp() }),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            operationCount += 1;
          });

          previousExams.forEach((exam) => {
            if (nextExamMap.has(exam.id)) return;
            batch.delete(doc(examsCollectionRef, exam.id));
            operationCount += 1;
          });

          if (operationCount > 0) await batch.commit();

          lastPersistedExamsRef.current = nextExams;
          pendingLocalExamsJsonRef.current = "";
          setSyncStatus("cloud-saved");
          setSyncMessage("Prüfungsplan Cloud gespeichert");
        } catch {
          setSyncStatus("cloud-error");
          setSyncMessage("Prüfungsplan Cloud-Fehler · lokales Backup aktiv");
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [shouldUseCloudSync, storageKey, user.uid]
  );

  const setExams = useCallback<Dispatch<SetStateAction<ExamPlanItem[]>>>(
    (action) => {
      setExamsState((currentExams) => {
        const nextExams =
          typeof action === "function"
            ? (action as (currentExams: ExamPlanItem[]) => ExamPlanItem[])(currentExams)
            : action;

        persistExams(nextExams);
        return nextExams;
      });
    },
    [persistExams]
  );

  return {
    exams: examsState,
    setExams,
    isLoaded,
    syncStatus,
    syncMessage,
  };
}
