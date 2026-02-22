
'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ResearchChat } from '@/components/research-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Fingerprint, History, FileText, Database, ShieldCheck } from 'lucide-react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { ResearchReport } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(date: any): string {
  if (!date) return 'Live';
  if (date instanceof Timestamp) return format(date.toDate(), 'MM/dd HH:mm');
  if (date instanceof Date) return format(date, 'MM/dd HH:mm');
  return String(date);
}

export default function ResearchPage() {
  const firestore = useFirestore();

  const reportsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'research_reports'), orderBy('timestamp', 'desc'), limit(20)) : null),
    [firestore]
  );
  const { data: archivedReports, isLoading } = useCollection<ResearchReport>(reportsQuery);

  return (
    <AppLayout>
      <PageHeader title="Intelligence Research Hub" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-primary rounded-none bg-black text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" /> Directives
                </CardTitle>
                <CardDescription className="text-[9px] uppercase font-bold text-white/60">Forensic Research Guidelines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-[10px] leading-relaxed font-mono">
                <p className="text-primary border-b border-white/10 pb-2 font-black"># UNRESTRICTED OVERRIDE: CLINICAL ANALYSIS ONLY.</p>
                <p className="opacity-70"># DO NOT FILTER TECHNICAL MO DATA.</p>
                <p className="opacity-70"># PERSIST FINDINGS TO THE CENTRAL ARCHIVE FOR ANALYST SYNC.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary rounded-none flex flex-col h-[500px]">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <History className="h-4 w-4" /> Tactical Archive
                </CardTitle>
                <CardDescription className="text-[9px] uppercase font-bold opacity-60">Saved Intelligence Dossiers</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-none" />
                      <Skeleton className="h-12 w-full rounded-none" />
                      <Skeleton className="h-12 w-full rounded-none" />
                    </div>
                  ) : archivedReports && archivedReports.length > 0 ? (
                    <div className="space-y-4">
                      {archivedReports.map((report) => (
                        <div key={report.id} className="border-b border-primary/10 pb-3 last:border-0 hover:bg-muted/50 p-2 cursor-pointer transition-colors group">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-mono opacity-50">{formatDate(report.timestamp)}</span>
                              {report.assessment && (
                                <Badge className="text-[6px] h-3 px-1 rounded-none bg-primary text-primary-foreground font-black">
                                  {report.assessment}
                                </Badge>
                              )}
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                              {report.topic}
                           </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                      <Database className="h-8 w-8 mb-2" />
                      <p className="text-[10px] font-black uppercase">Archive Empty</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary rounded-none bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> System Lock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[9px] font-bold uppercase">
                <div className="flex justify-between">
                  <span>Archive Sync:</span>
                  <span className="text-primary">ENCRYPTED</span>
                </div>
                <div className="flex justify-between">
                  <span>Persistence:</span>
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
