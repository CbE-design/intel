
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

export type ResearchReport = {
  id: string;
  topic: string;
  content: string;
  assessment?: string;
  trendData?: any;
  timestamp: Timestamp | Date | string;
  analyst: string;
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
  details?: string;
  confidence?: number;
}

export interface SherlockResult {
  site: string;
  exists: boolean;
  url?: string;
}

export interface HarvesterResult {
  source: string;
  type: 'Email' | 'Domain' | 'IP' | string;
  value: string;
  leaked: boolean;
}

export interface PhoneInfogaResult {
  carrier: string;
  location: string;
  type: string;
  valid: boolean;
  inspectors: string[];
}

export interface HoleheResult {
  site: string;
  exists: boolean;
  rateLimit: boolean;
}

export interface RICAVerification {
  status: 'Verified' | 'Unverified' | 'Mismatch';
  registeredName: string;
  registeredId: string;
  registeredAddress: string;
  ricaDate: string;
  provider: string;
}

export interface BreachResult {
  name: string;
  domain: string;
  breachDate: string;
  dataClasses: string[];
  description: string;
}

export interface NetworkIntel {
  ip: string;
  ports: number[];
  os: string | null;
  vulns: string[];
}
