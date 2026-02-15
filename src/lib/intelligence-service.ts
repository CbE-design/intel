'use client';

/**
 * @fileOverview Advanced Intelligence Service
 * 
 * Simulated integration layer for South African investigative workflows.
 * Inspired by OSINT repositories (Sherlock, theHarvester) and corporate registry scrapers.
 */

import { type CorporateLinkage, type OSINTMatch } from './types';

export type IntelligenceSourceStatus = 'Connected' | 'Error' | 'Inactive';

export interface IntelligenceSource {
  id: string;
  name: string;
  provider: string;
  type: 'Criminal' | 'Credit' | 'Identity' | 'Location' | 'Corporate' | 'OSINT';
  status: IntelligenceSourceStatus;
  lastSync?: Date;
}

export const MOCK_SOURCES: IntelligenceSource[] = [
  { id: 'src_1', name: 'SAPS National Criminal DB', provider: 'MIE / SAPS', type: 'Criminal', status: 'Connected', lastSync: new Date() },
  { id: 'src_2', name: 'TransUnion Bureau Search', provider: 'TransUnion', type: 'Credit', status: 'Connected', lastSync: new Date() },
  { id: 'src_3', name: 'CIPC Company Registry', provider: 'SearchWorks', type: 'Corporate', status: 'Connected', lastSync: new Date() },
  { id: 'src_4', name: 'Identity Verification (Home Affairs)', provider: 'LexisNexis', type: 'Identity', status: 'Connected', lastSync: new Date() },
  { id: 'src_5', name: 'Global OSINT Crawler', provider: 'Veritas Custom (GitHub Inspired)', type: 'OSINT', status: 'Connected', lastSync: new Date() },
];

export async function testIntelligenceConnection(sourceId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const source = MOCK_SOURCES.find(s => s.id === sourceId);
  if (!source) return { success: false, message: 'Source not found' };
  
  return { success: true, message: `Successfully authenticated with ${source.provider} API gateway.` };
}

export async function getCorporateLinkages(idNumber: string): Promise<CorporateLinkage[]> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Seed-based randomization for consistency
  if (idNumber.includes('85') || idNumber.includes('79') || idNumber.includes('88')) {
    return [
      { companyName: 'VERITAS HOLDINGS (PTY) LTD', registrationNumber: '2018/456789/07', role: 'Director', status: 'Active', appointmentDate: '2018-05-12' },
      { companyName: 'TECH-VEST SOUTH AFRICA', registrationNumber: '2021/112233/07', role: 'Director', status: 'Active', appointmentDate: '2021-11-20' },
    ];
  }
  return [];
}

export async function getOSINTMatches(name: string, idNumber: string): Promise<OSINTMatch[]> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    { platform: 'LinkedIn', status: 'Match Found', details: `Profile identified for ${name}. Position matches reported industry.`, confidence: 95 },
    { platform: 'Social Media (Twitter/FB)', status: 'Match Found', details: 'Active profiles identified. No extremist content flagged.', confidence: 80 },
    { platform: 'Government Gazette', status: 'No Match', details: 'No insolvency or legal notices found in the past 10 years.', confidence: 100 },
    { platform: 'SAPS Wanted List', status: 'No Match', details: 'Subject is not listed in active national wanted circulations.', confidence: 100 }
  ];
}

export async function performDeepOSINTDiscovery(name: string, idNumber: string): Promise<OSINTMatch[]> {
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Simulating deep discovery results from multiple "engines"
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
    },
    { 
      platform: 'Domain Registrations', 
      status: 'Match Found', 
      details: 'Identified 2 web domains registered under this ID/Name.', 
      evidence: 'Domain veritas-intel-mock.co.za and south-africa-investigations.co.za registered in 2022.',
      confidence: 90
    }
  ];
}
