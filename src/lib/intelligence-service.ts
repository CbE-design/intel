/**
 * @fileOverview Professional Intelligence Gateway Service
 * 
 * Implements realistic identity validation, financial handshake simulations,
 * and PEP screening modules specific to the South African regulatory framework.
 */

import { 
  type CorporateLinkage, 
  type OSINTMatch, 
  type SherlockResult, 
  type HarvesterResult,
  type PhoneInfogaResult,
  type HoleheResult,
  type RICAVerification,
  type BreachResult,
  type NetworkIntel,
  type BankVerification,
  type PEPScreening
} from './types';

export type IntelligenceSourceStatus = 'Connected' | 'Error' | 'Inactive';

export interface IntelligenceSource {
  id: string;
  name: string;
  provider: string;
  type: 'Criminal' | 'Credit' | 'Identity' | 'Location' | 'Corporate' | 'OSINT' | 'RICA' | 'Breach' | 'Network' | 'Financial';
  status: IntelligenceSourceStatus;
  lastSync?: Date;
}

/**
 * Realistic South African ID Validator (Luhn Algorithm)
 */
export function validateSouthAfricanID(idNumber: string): { 
  isValid: boolean; 
  metadata?: { 
    dob: string; 
    gender: 'Male' | 'Female'; 
    citizenship: 'SA Citizen' | 'Permanent Resident';
  } 
} {
  if (!/^[0-9]{13}$/.test(idNumber)) return { isValid: false };

  // Luhn Check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(idNumber.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const isValid = sum % 10 === 0;

  if (!isValid) return { isValid: false };

  // Metadata Extraction
  const yearStr = idNumber.substring(0, 2);
  const monthStr = idNumber.substring(2, 4);
  const dayStr = idNumber.substring(4, 6);
  const genderCode = parseInt(idNumber.substring(6, 10));
  const citizenCode = parseInt(idNumber.substring(10, 11));

  const currentYear = new Date().getFullYear() % 100;
  const birthYear = parseInt(yearStr) > currentYear ? `19${yearStr}` : `20${yearStr}`;
  
  return {
    isValid: true,
    metadata: {
      dob: `${birthYear}-${monthStr}-${dayStr}`,
      gender: genderCode >= 5000 ? 'Male' : 'Female',
      citizenship: citizenCode === 0 ? 'SA Citizen' : 'Permanent Resident'
    }
  };
}

export const MOCK_SOURCES: IntelligenceSource[] = [
  { id: 'src_1', name: 'SAPS National Criminal DB', provider: 'MIE / SAPS Gateway', type: 'Criminal', status: 'Connected', lastSync: new Date() },
  { id: 'src_2', name: 'TransUnion Bureau Search', provider: 'TransUnion SA', type: 'Credit', status: 'Connected', lastSync: new Date() },
  { id: 'src_3', name: 'CIPC Company Registry', provider: 'SearchWorks CIPC', type: 'Corporate', status: 'Connected', lastSync: new Date() },
  { id: 'src_4', name: 'DHA Identity Verification', provider: 'LexisNexis / Home Affairs', type: 'Identity', status: 'Connected', lastSync: new Date() },
  { id: 'src_5', name: 'RICA Registration Gateway', provider: 'National RICA Portal', type: 'RICA', status: 'Connected', lastSync: new Date() },
  { id: 'src_6', name: 'Bank Verification (AVS)', provider: 'Inter-Bank Gateway', type: 'Financial', status: 'Connected', lastSync: new Date() },
  { id: 'src_7', name: 'PEP/Sanction Screening', provider: 'World-Check Global', type: 'OSINT', status: 'Connected', lastSync: new Date() },
];

/**
 * Realistic Bank Account Verification (AVS)
 */
export async function performBankVerification(idNumber: string, name: string): Promise<BankVerification> {
  await new Promise(resolve => setTimeout(resolve, 1800));
  const isFlagged = idNumber.startsWith('8');
  return {
    accountFound: true,
    holderMatch: !isFlagged,
    accountStatus: isFlagged ? 'Frozen' : 'Open',
    accountType: 'Current',
    verifiedDate: new Date().toISOString()
  };
}

/**
 * Realistic PEP and Sanction Screening
 */
export async function screenPEP(name: string): Promise<PEPScreening> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const isPEP = name.toUpperCase().includes('ZUMA') || name.toUpperCase().includes('GUPTA');
  return {
    onList: isPEP,
    riskLevel: isPEP ? 'High' : 'None',
    source: 'Veritas Sanction Aggregator',
    details: isPEP ? 'Subject identified on regional influence and politically exposed persons registry.' : undefined
  };
}

export async function performRICAReview(phone: string, idNumber: string): Promise<RICAVerification> {
  const validation = validateSouthAfricanID(idNumber);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    status: validation.isValid ? 'Verified' : 'Mismatch',
    registeredName: 'Subject Identity Match',
    registeredId: idNumber,
    registeredAddress: 'Registered Domicile Verified via Gateway',
    ricaDate: '2023-11-20',
    provider: 'MTN/Vodacom RICA Portal'
  };
}

export async function performBreachLookup(identifier: string): Promise<BreachResult[]> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const isFlagged = identifier.startsWith('8');
  return isFlagged ? [
    { 
      name: '2021 TransUnion Data Leak', 
      domain: 'transunion.co.za', 
      breachDate: '2021-03-12', 
      dataClasses: ['ID Number', 'Name', 'Phone'],
      description: 'Historical financial sector data exposure identified via dark web aggregate.'
    }
  ] : [];
}

export async function performNetworkRecon(ip: string): Promise<NetworkIntel> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    ip: ip,
    ports: [80, 443, 8080],
    os: 'Linux 5.x / Android Kernel',
    vulns: ['CVE-2023-44487']
  };
}

export async function performSherlockSearch(name: string): Promise<SherlockResult[]> {
  const username = name.toLowerCase().replace(/\s/g, '');
  await new Promise(resolve => setTimeout(resolve, 2000));
  const platforms = ['GitHub', 'Reddit', 'Instagram', 'Twitter', 'LinkedIn'];
  return platforms.map(p => ({
    site: p,
    exists: Math.random() > 0.6,
    url: `https://${p.toLowerCase()}.com/${username}`
  }));
}

export async function performHarvesterSearch(idNumber: string): Promise<HarvesterResult[]> {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return [
    { source: 'google', type: 'Email', value: `intel-${idNumber.slice(-4)}@proton.me`, leaked: true },
    { source: 'shodan', type: 'IP', value: '102.165.4.12', leaked: false }
  ];
}

export async function performPhoneInfogaSearch(phone: string): Promise<PhoneInfogaResult> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    carrier: phone.startsWith('+278') ? 'Vodacom South Africa' : 'MTN South Africa',
    location: 'Gauteng, ZA',
    type: 'Mobile',
    valid: true,
    inspectors: ['Numverify', 'SocialScan']
  };
}

export async function performHoleheSearch(email: string): Promise<HoleheResult[]> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return ['Instagram', 'LinkedIn', 'Discord'].map(site => ({
    site,
    exists: Math.random() > 0.4,
    rateLimit: false
  }));
}

export async function getCorporateLinkages(idNumber: string): Promise<CorporateLinkage[]> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  const isBusinessLinked = idNumber.startsWith('8') || idNumber.startsWith('7');
  if (isBusinessLinked) {
    return [
      { companyName: 'VERITAS SECURITY SOLUTIONS', registrationNumber: '2019/456789/07', role: 'Director', status: 'Active', appointmentDate: '2019-05-12' },
    ];
  }
  return [];
}

export async function getDeedsOfficeRecords(idNumber: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return idNumber.startsWith('8') ? [
    { address: '123 Rivonia Rd, Sandton', estimatedValue: 4500000, purchaseDate: '2015-10-01' }
  ] : [];
}

export async function getVehicleRegistryRecords(idNumber: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return idNumber.startsWith('8') ? [
    { make: 'BMW', model: 'M3', licensePlate: 'GP 123 456' }
  ] : [];
}

export async function getOSINTMatches(name: string, idNumber: string): Promise<OSINTMatch[]> {
  const isFlagged = idNumber.startsWith('8');
  await new Promise(resolve => setTimeout(resolve, 2000));
  return isFlagged ? [
    { 
      platform: 'Dark Web Leaks', 
      status: 'Match Found', 
      details: 'ID Number identified in historical 2021 financial data breach.', 
      confidence: 94
    }
  ] : [];
}

export async function testIntelligenceConnection(sourceId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: `Handshake successful.` };
}
