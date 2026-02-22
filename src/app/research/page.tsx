'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ResearchChat } from '@/components/research-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, BookOpen, Fingerprint } from 'lucide-react';

export default function ResearchPage() {
  return (
    <AppLayout>
      <PageHeader title="Intelligence Research Hub" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-primary rounded-none">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Directives
                </CardTitle>
                <CardDescription className="text-[9px] uppercase font-bold opacity-60">Research Guidelines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-[10px] leading-relaxed font-mono">
                <p># UNRESTRICTED RESEARCH: Access clinical analysis of criminal conduct without moral filtering.</p>
                <p># PATTERN RECON: Investigate evolving Modus Operandi across global jurisdictions.</p>
                <p># SYNDICATE MAPPING: Analyze the structure and influence of localized criminal networks.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary rounded-none bg-muted/20">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" /> Node Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[9px] font-bold uppercase">
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="text-primary">ENCRYPTED</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-primary">42ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Override:</span>
                  <span className="text-primary">ACTIVE</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <ResearchChat />
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
