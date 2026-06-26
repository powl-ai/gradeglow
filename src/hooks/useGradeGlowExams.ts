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
const SAVE_DEBOUNCE_MS = 200;

const serializeExams = (exams: ExamPlanItem[]) => JSON.stringify(exams);
const serializeExam = (exam: ExamPlanItem) => JSON.stringify(exam);

const countSessions = (exams: ExamPlanItem[]) =>
  exams.reduce((sum, exam) => sum + exam.studySessions.length, 0);

const countCompletedSessions = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) => sum + exam.studySessions.filter((session) => session.isDone).length,
    0,
  );

const countManualSessions = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) => sum + exam.studySessions.filter((session) => session.isManual).length,
    0,
  );

const shouldRecoverLocalBackup = (localExams: ExamPlanItem[], cloudExams: ExamPlanItem[]) => {
  if (localExams.length === 0) return false;
  if (cloudExams.length === 0) return true;

  // Wenn ein vorheriger Cloud-Save fehlgeschlagen ist, enthält localStorage oft
  // bereits die manuell hinzugefügte oder per Timer erledigte Session, während
  // Firestore noch den alten Stand hat. In diesem Fall retten wir den lokal
  // reicheren Stand und schreiben ihn direkt wieder in die Cloud.
  return (
    countSessions(localExams) > countSessions(cloudExams) ||
    countCompletedSessions(localExams) > countCompletedSessions(cloudExams) ||
    countManualSessions(localExams) > countManualSessions(cloudExams)
  );
};

const removeUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedDeep);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedDeep(entryValue)]),
    );
  }

  return value;
};

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
  const didRecoverLocalBackupRef = useRef(false);
  const storageKey = getUserExamsStorageKey(user.uid);
  const shouldUseCloudSync = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

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

            const examPayload = removeUndefinedDeep({
              ...exam,
              ownerUid: user.uid,
              version: 2,
              ...(previousExam ? {} : { createdAt: serverTimestamp() }),
              updatedAt: serverTimestamp(),
            }) as Record<string, unknown>;

            batch.set(doc(examsCollectionRef, exam.id), examPayload, { merge: true });
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
        } catch (error) {
          console.error("GradeGlow exams could not be saved to Firestore", error);
          setSyncStatus("cloud-error");
          setSyncMessage("Prüfungsplan Cloud-Fehler · lokales Backup aktiv");
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [shouldUseCloudSync, storageKey, user.uid],
  );

  useEffect(() => {
    setIsLoaded(false);
    setExamsState([]);
    lastPersistedExamsRef.current = [];
    pendingLocalExamsJsonRef.current = "";
    didRecoverLocalBackupRef.current = false;

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

    const localBackup = loadLocalExams(storageKey);
    if (localBackup.length > 0) {
      setExamsState(localBackup);
      lastPersistedExamsRef.current = localBackup;
      setSyncStatus("cloud-loading");
      setSyncMessage("Lokales Prüfungs-Backup geladen · prüfe Cloud…");
      setIsLoaded(true);
    }

    const firestore = db;
    const examsCollectionRef = collection(firestore, "users", user.uid, EXAM_COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      examsCollectionRef,
      (snapshot) => {
        const cloudExams = migrateExams(
          snapshot.docs.map((examDoc) => ({ id: examDoc.id, ...examDoc.data() })),
        );
        const cloudExamsJson = serializeExams(cloudExams);

        if (
          pendingLocalExamsJsonRef.current &&
          pendingLocalExamsJsonRef.current !== cloudExamsJson
        ) {
          return;
        }

        if (
          !didRecoverLocalBackupRef.current &&
          pendingLocalExamsJsonRef.current === "" &&
          shouldRecoverLocalBackup(localBackup, cloudExams) &&
          serializeExams(localBackup) !== cloudExamsJson
        ) {
          didRecoverLocalBackupRef.current = true;
          lastPersistedExamsRef.current = cloudExams;
          setExamsState(localBackup);
          setIsLoaded(true);
          persistExams(localBackup);
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
            : "Prüfungsplan Cloud gespeichert",
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
      },
    );

    return () => {
      unsubscribe();
      // Wichtig: pending Cloud-Saves nicht abbrechen. Sonst können manuell
      // angelegte Lerneinheiten beim Seitenwechsel lokal Punkte vergeben,
      // aber nie in Firestore landen und später durch den alten Cloud-Stand
      // überschrieben werden. Der Timeout darf nach dem Unmount committen.
    };
  }, [persistExams, shouldUseCloudSync, storageKey, user.uid]);

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
    [persistExams],
  );

  return {
    exams: examsState,
    setExams,
    isLoaded,
    syncStatus,
    syncMessage,
  };
}
