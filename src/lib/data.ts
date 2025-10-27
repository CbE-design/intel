import {
  collection,
  doc,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/firebase/lib';
import type { Subject, Location } from './types';

const subjectsCollection = collection(firestore, 'subject_profiles');

export async function getSubjects(): Promise<Subject[]> {
  const snapshot = await getDocs(subjectsCollection);
  const subjects: Subject[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    subjects.push({
      id: doc.id,
      name: data.name,
      idNumber: data.idNumber,
      address: data.address,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
      status: data.status,
      lastCheck: (data.lastCheck as Timestamp).toDate().toLocaleDateString(),
    } as Subject);
  });
  return subjects;
}

export async function getSubjectById(id: string): Promise<Subject | undefined> {
  const docRef = doc(firestore, 'subject_profiles', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      idNumber: data.idNumber,
      address: data.address,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
      status: data.status,
      lastCheck: (data.lastCheck as Timestamp).toDate().toLocaleDateString(),
    } as Subject;
  } else {
    return undefined;
  }
}

export async function getSubjectLocations(
  subjectId: string
): Promise<Location[]> {
  const locationsCollection = collection(
    firestore,
    'subject_profiles',
    subjectId,
    'location_data'
  );
  const snapshot = await getDocs(locationsCollection);
  const locations: Location[] = [];
  snapshot.forEach((doc) => {
    locations.push(doc.data() as Location);
  });
  return locations;
}
