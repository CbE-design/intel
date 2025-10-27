export type Subject = {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phoneNumber: string;
  avatarUrl: string;
  status: 'Clear' | 'Review' | 'Pending';
  lastCheck: string;
};

export type Location = {
  lat: number;
  lng: number;
  timestamp: string;
};

export type Report = {
  report: string;
  riskAssessment: string;
};
