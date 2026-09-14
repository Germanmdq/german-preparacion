import type { ScoreMap, Answers } from '@/lib/assessment/scoring';
import type { PatternKey } from '@/data/questions';

export type AudioPlayEvent = { questionId: string; optionId: string; playedAt: string; order: number };
export type AssessmentSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  answers: Answers;
  audioPlayEvents: AudioPlayEvent[];
  scores: ScoreMap | null;
  primaryPattern: PatternKey | null;
  secondaryPattern: PatternKey | null;
  resultVersion: string;
  restartOf?: string;
};

export interface AssessmentStorage {
  load(uid: string): AssessmentSession | null;
  save(uid: string, session: AssessmentSession): void;
  clear(uid: string): void;
}

const KEY_PREFIX = 'german-preparacion:assessment:v1';

export const assessmentStorageKey = (uid: string) => `${KEY_PREFIX}:${uid}`;

export const createSession = (now = new Date(), restartOf?: string): AssessmentSession => {
  const timestamp = now.toISOString();
  return {
    sessionId: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    answers: {},
    audioPlayEvents: [],
    scores: null,
    primaryPattern: null,
    secondaryPattern: null,
    resultVersion: 'provisional-v1',
    ...(restartOf ? { restartOf } : {}),
  };
};

export const assessmentStorage: AssessmentStorage = {
  load: (uid) => {
    try {
      const raw = localStorage.getItem(assessmentStorageKey(uid));
      return raw ? JSON.parse(raw) as AssessmentSession : null;
    } catch {
      return null;
    }
  },
  save: (uid, session) => {
    try {
      localStorage.setItem(assessmentStorageKey(uid), JSON.stringify(session));
    } catch {
      // Firestore remains the persistent source if local storage is unavailable.
    }
  },
  clear: (uid) => {
    try {
      localStorage.removeItem(assessmentStorageKey(uid));
    } catch {
      // Signing out must still succeed when local storage is unavailable.
    }
  },
};
