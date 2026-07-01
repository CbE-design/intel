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
  status: 'Active' | 'Deregistered' | 'Liquidation' | 'Final Liquidation';
  appointmentDate: string;
}

export interface BankVerification {
  accountFound: boolean;
  holderMatch: boolean;
  accountStatus: 'Open' | 'Closed' | 'Frozen';
  accountType: 'Current' | 'Savings' | 'Business';
  verifiedDate: string;
}

export interface PEPScreening {
  onList: boolean;
  riskLevel: 'None' | 'Low' | 'Medium' | 'High';
  source: string;
  details?: string;
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

export interface SAIDDecodeResult {
  isValid: boolean;
  dob?: string;
  age?: number;
  gender?: "Male" | "Female";
  citizenship?: "SA Citizen" | "Permanent Resident";
  genderSequence?: string;
  controlDigit?: string;
  error?: string;
}

export interface PhoneIntelligence {
  isValid: boolean;
  isPossible?: boolean;
  national?: string;
  international?: string;
  uri?: string;
  country?: string;
  countryCallingCode?: string;
  nationalNumber?: string;
  lineType?: string;
  error?: string;
}

export interface IPIntelligence {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  asn: string;
  timezone: string;
  lat: number;
  lon: number;
  isMobile: boolean;
  isProxy: boolean;
  isHosting: boolean;
  ports: number[];
  vulns: string[];
  tags: string[];
  hostnames: string[];
  cpes: string[];
}

export interface CertificateEntry {
  id: number;
  commonName: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  loggedAt: string;
}

export interface DomainIntelligence {
  domain: string;
  aRecords: string[];
  mxRecords: string[];
  nsRecords: string[];
  txtRecords: string[];
  certificates: CertificateEntry[];
}

export interface CaseNote {
  id: string;
  content: string;
  tag: "Evidence" | "Observation" | "Action" | "Alert";
  analyst: string;
  timestamp: Timestamp | Date | string;
}
