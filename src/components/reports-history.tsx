'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function formatDate(date: any): string {
  if (!date) return 'Unknown Date';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'PPP p');
  }
  if (date instanceof Date) {
    return format(date, 'PPP p');
  }
  return String(date);
}

export function ReportsHistory({ reports, isLoading }: { reports: any[], isLoading: boolean }) {
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
        <CardTitle>No Historical Reports</CardTitle>
        <CardDescription className="text-center mt-2 max-w-[300px]">
          No investigative reports have been generated for this subject yet.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Investigative History</CardTitle>
          <CardDescription>Archive of all AI-generated background reports and risk assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {reports.map((report, index) => (
              <AccordionItem key={report.id || index} value={`item-${index}`} className="border rounded-lg px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center justify-between text-left">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Intelligence Report #{reports.length - index}</span>
                        <Badge variant="secondary" className="text-[10px] py-0">AI GEN</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.timestamp)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 space-y-6 border-t mt-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      FINDINGS SUMMARY
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {report.report}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <ShieldCheck className="h-4 w-4" />
                      RISK ASSESSMENT
                    </div>
                    <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {report.riskAssessment}
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

import { History } from 'lucide-react';
