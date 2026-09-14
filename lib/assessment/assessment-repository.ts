import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AssessmentSession } from '@/lib/storage/assessment-storage';

export type RemoteAssessmentDocument = { id: string; data: unknown };

export const loadRemoteAssessmentSessions = async (uid: string): Promise<RemoteAssessmentDocument[]> => {
  const snapshot = await getDocs(collection(db, 'users', uid, 'assessments'));
  return snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
};

export const saveRemoteAssessmentSession = async (uid: string, email: string, session: AssessmentSession) => {
  await setDoc(doc(db, 'users', uid, 'assessments', session.sessionId), {
    uid,
    email,
    sessionId: session.sessionId,
    answers: session.answers,
    audioPlayEvents: session.audioPlayEvents,
    createdAt: session.createdAt,
    updatedAt: serverTimestamp(),
    completedAt: session.completedAt,
    scores: session.scores,
    primaryPattern: session.primaryPattern,
    secondaryPattern: session.secondaryPattern,
    resultVersion: session.resultVersion,
    ...(session.restartOf ? { restartOf: session.restartOf } : {}),
  }, { merge: true });
};
