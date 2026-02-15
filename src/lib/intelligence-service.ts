'use client';

/**
 * @fileOverview Mock Intelligence Service
 * 
 * This service simulates connections to South African intelligence providers
 * like SAPS, TransUnion, and CIPC. This is the integration layer where
 * real API calls will be implemented.
 */

export type IntelligenceSourceStatus = 'Connected' | 'Error' | 'Inactive';

export interface IntelligenceSource {
  id: string;
  name: string;
  provider: string;
  type: 'Criminal' | 'Credit' | 'Identity' | 'Location';
  status: IntelligenceSourceStatus;
  lastSync?: Date;
}

export const MOCK_SOURCES: IntelligenceSource[] = [
  { id: 'src_1', name: 'SAPS National Criminal DB', provider: 'MIE / SAPS', type: 'Criminal', status: 'Connected', lastSync: new Date() },
  { id: 'src_2', name: 'TransUnion Bureau Search', provider: 'TransUnion', type: 'Credit', status: 'Connected', lastSync: new Date() },
  { id: 'src_3', name: 'CIPC Company Registry', provider: 'SearchWorks', type: 'Identity', status: 'Inactive' },
  { id: 'src_4', name: 'Identity Verification (Home Affairs)', provider: 'LexisNexis', type: 'Identity', status: 'Connected', lastSync: new Date() },
];

export async function testIntelligenceConnection(sourceId: string): Promise<{ success: boolean; message: string }> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const source = MOCK_SOURCES.find(s => s.id === sourceId);
  if (!source) return { success: false, message: 'Source not found' };
  
  // Simulation: CIPC always fails for demo purposes until "configured"
  if (source.type === 'Identity' && source.provider === 'SearchWorks') {
    return { success: false, message: 'API Key Rejected by SearchWorks Gateway.' };
  }
  
  return { success: true, message: `Successfully authenticated with ${source.provider} API.` };
}

export async function mockVerificationCheck(idNumber: string, type: 'criminal' | 'credit') {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (type === 'criminal') {
    return {
      hasRecord: idNumber.startsWith('8'), // Mock flag for demonstration
      details: idNumber.startsWith('8') ? 'Minor incident: Reckless driving (2019)' : 'No records found.',
      authority: 'Verified via SAPS Digital Certificate'
    };
  }
  
  return {
    score: 650 + Math.floor(Math.random() * 150),
    risk: 'Low',
    flags: []
  };
}
