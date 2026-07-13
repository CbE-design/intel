'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, ShieldCheck, Download, History } from 'lucide-react';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { Report } from '@/lib/types';

function formatDate(date: any): string {
  if (!date) return 'Unknown Date';
  try {
    return format(new Date(date), 'PPP p');
  } catch {
    return String(date);
  }
}

export function ReportsHistory({ reports, isLoading }: { reports: Report[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Historical Archive Empty</CardTitle>
        <CardDescription className="text-center mt-2 max-w-[300px]">
          No investigative intelligence has been generated for this subject profile yet.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Investigative History</CardTitle>
            <CardDescription>Verified archive of all system-generated intelligence cycles.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export All
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {reports.map((report, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 mb-4 overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex flex-1 items-center justify-between text-left">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Intelligence Dossier #{reports.length - index}</span>
                        <Badge variant="outline" className="text-[9px] h-4 bg-primary/5">VERIFIED</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.timestamp)}
                        <span className="mx-1">•</span>
                        <span>Analyst: {report.initiatedBy || 'Veritas Engine'}</span>
                      </div>
                    </div>
                    <div className="mr-4 text-right hidden md:block">
                      <div className="text-lg font-bold">{report.verificationScore}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Conf. Score</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-8 space-y-8 border-t mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <FileText className="h-3 w-3" />
                        Detailed Analysis Narrative
                      </div>
                      <div className="bg-muted/30 border rounded-lg p-6 text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground/90 italic">
                        {report.report}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                          <ShieldCheck className="h-3 w-3" />
                          Risk Determination
                        </div>
                        <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4">
                          <div className="text-xs font-bold text-primary mb-1 uppercase">{report.riskAssessment}</div>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Subject poses no active threats based on the parameters checked in this cycle.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Search Parameters
                        </div>
                        <div className="grid gap-1.5">
                          {report.parameters && Object.entries(report.parameters).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-[11px]">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <Badge variant={value ? 'default' : 'secondary'} className="h-3 px-1.5 text-[8px]">
                                {value ? 'TRUE' : 'FALSE'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full text-xs h-8">
                        View Audit Log
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
