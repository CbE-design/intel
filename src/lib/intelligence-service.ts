'use client';

/**
 * @fileOverview Advanced Intelligence Service
 * 
 * Simulated integration layer for South African investigative workflows.
 * Mimics high-fidelity GitHub OSINT tools and RSA regulatory checks (RICA, CIPC).
 */

import { 
  type CorporateLinkage, 
  type OSINTMatch, 
  type SherlockResult, 
  type HarvesterResult,
  type PhoneInfogaResult,
  type HoleheResult,
  type RICAVerification
} from './types';

export type IntelligenceSourceStatus = 'Connected' | 'Error' | 'Inactive';

export interface IntelligenceSource {
  id: string;
  name: string;
  provider: string;
  type: 'Criminal' | 'Credit' | 'Identity' | 'Location' | 'Corporate' | 'OSINT' | 'RICA';
  status: IntelligenceSourceStatus;
  lastSync?: Date;
}

export const MOCK_SOURCES: IntelligenceSource[] = [
  { id: 'src_1', name: 'SAPS National Criminal DB', provider: 'MIE / SAPS', type: 'Criminal', status: 'Connected', lastSync: new Date() },
  { id: 'src_2', name: 'TransUnion Bureau Search', provider: 'TransUnion', type: 'Credit', status: 'Connected', lastSync: new Date() },
  { id: 'src_3', name: 'CIPC Company Registry', provider: 'SearchWorks', type: 'Corporate', status: 'Connected', lastSync: new Date() },
  { id: 'src_4', name: 'Identity Verification (Home Affairs)', provider: 'LexisNexis', type: 'Identity', status: 'Connected', lastSync: new Date() },
  { id: 'src_5', name: 'RICA Registration Gateway', provider: 'Vodacom/MTN Portal', type: 'RICA', status: 'Connected', lastSync: new Date() },
  { id: 'src_6', name: 'Global OSINT Crawler', provider: 'Veritas Custom (Sherlock/Harvester)', type: 'OSINT', status: 'Connected', lastSync: new Date() },
];

export async function testIntelligenceConnection(sourceId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const source = MOCK_SOURCES.find(s => s.id === sourceId);
  if (!source) return { success: false, message: 'Source not found' };
  
  return { success: true, message: `Successfully authenticated with ${source.provider} API gateway.` };
}

export async function performRICAReview(phone: string, idNumber: string): Promise<RICAVerification> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Logic: Mock verification based on ID consistency
  const isMatch = idNumber.length === 13;
  return {
    status: isMatch ? 'Verified' : 'Mismatch',
    registeredName: isMatch ? 'Subject Name Match (Encrypted)' : 'NAME_MISMATCH_ERROR',
    registeredId: idNumber,
    registeredAddress: 'Registered Domicile Match',
    ricaDate: '2022-04-15',
    provider: 'Vodacom SA (Managed)'
  };
}

export async function getCorporateLinkages(idNumber: string): Promise<CorporateLinkage[]> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  if (idNumber.includes('85') || idNumber.includes('79') || idNumber.includes('88')) {
    return [
      { companyName: 'VERITAS HOLDINGS (PTY) LTD', registrationNumber: '2018/456789/07', role: 'Director', status: 'Active', appointmentDate: '2018-05-12' },
      { companyName: 'TECH-VEST SOUTH AFRICA', registrationNumber: '2021/112233/07', role: 'Director', status: 'Active', appointmentDate: '2021-11-20' },
    ];
  }
  return [];
}

export async function performPhoneInfogaSearch(phone: string): Promise<PhoneInfogaResult> {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return {
    carrier: 'Vodacom South Africa',
    location: 'Gauteng, ZA',
    type: 'Mobile',
    valid: true,
    inspectors: ['Numverify', 'GoogleSearch', 'SocialScan']
  };
}

export async function performHoleheSearch(email: string): Promise<HoleheResult[]> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const sites = ['Instagram', 'Twitter', 'LinkedIn', 'Snapchat', 'Discord', 'GitHub'];
  return sites.map(site => ({
    site,
    exists: Math.random() > 0.4,
    rateLimit: false
  }));
}

export async function performSherlockSearch(name: string): Promise<SherlockResult[]> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const username = name.toLowerCase().replace(/\s/g, '');
  const platforms = ['GitHub', 'Reddit', 'Instagram', 'Twitter', 'Pinterest', 'Medium', 'StackOverflow', 'Behance', 'Patreon', 'GitLab'];
  
  return platforms.map(p => ({
    site: p,
    exists: Math.random() > 0.5,
    url: Math.random() > 0.5 ? `https://${p.toLowerCase()}.com/${username}` : undefined
  }));
}

export async function performHarvesterSearch(idNumber: string): Promise<HarvesterResult[]> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [
    { source: 'google', type: 'Email', value: `intel-${idNumber.slice(-4)}@proton.me`, leaked: true },
    { source: 'bing', type: 'Domain', value: `veritas-${idNumber.slice(0, 4)}.co.za`, leaked: false },
    { source: 'hunter.io', type: 'Email', value: `archive-${idNumber.slice(0, 6)}@gmail.com`, leaked: true },
    { source: 'shodan', type: 'IP', value: '102.165.4.12', leaked: false }
  ];
}

export async function getOSINTMatches(name: string, idNumber: string): Promise<OSINTMatch[]> {
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  return [
    { 
      platform: 'Dark Web Leaks (Simulated)', 
      status: 'Match Found', 
      details: 'Email associated with this identity found in 2021 global data breach.', 
      evidence: 'Leaked metadata confirms secondary mobile number starting with +2782...',
      confidence: 75
    },
    { 
      platform: 'International Sanctions List', 
      status: 'No Match', 
      details: 'Cross-checked against OFAC, EU, and UN consolidated sanctions lists.', 
      evidence: 'No record found in global PEP (Politically Exposed Persons) databases.',
      confidence: 100
    }
  ];
}
