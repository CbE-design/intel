import type { Timestamp } from 'firebase/firestore';

export type Subject = {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phoneNumber: string;
  avatarUrl: string;
  status: 'Clear' | 'Review' | 'Pending';
  lastCheck: Timestamp | Date | string;
};

export type Location = {
  lat: number;
  lng: number;
  timestamp: Timestamp;
};

export type Report = {
  report: string;
  riskAssessment: string;
};
