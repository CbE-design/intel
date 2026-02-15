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
  consent?: boolean;
  deviceId?: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  timestamp: Timestamp | Date | string;
  analyst: string;
  status: 'Success' | 'Warning' | 'Info';
};

export type Report = {
  report: string;
  riskAssessment: string;
  verificationScore: number;
  timestamp?: Timestamp | Date | string;
  initiatedBy?: string;
  parameters?: {
    criminalRecordCheck: boolean;
    creditHistoryCheck: boolean;
    employmentVerification: boolean;
  };
};

export interface CorporateLinkage {
  companyName: string;
  registrationNumber: string;
  role: string;
  status: string;
  appointmentDate: string;
}

export interface OSINTMatch {
  platform: string;
  status: 'Match Found' | 'No Match' | 'Pending';
  link?: string;
  details?: string;
}
