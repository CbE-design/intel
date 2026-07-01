'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { generateReportAction } from '@/lib/actions';
import type { Subject } from '@/lib/types';
import { backgroundCheckSchema, type BackgroundCheckSchema } from '@/app/schemas';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Save, ShieldCheck, Activity, Search, Database, Globe } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { sanitizeForServer } from '@/lib/utils';

type FormState = {
  error?: string;
  report?: { report: string; riskAssessment: string; verificationScore: number };
};

const initialState: FormState = {};

const INVESTIGATIVE_STEPS = [
  "Initializing Secure Tunnel...",
  "Querying DHA Gateways...",
  "SAPS Record Check...",
  "Analyzing Financial Profile...",
  "Verifying Credentials...",
  "Synthesizing Risk Model...",
  "Finalizing Dossier..."
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full h-12 md:h-10 uppercase text-xs font-black tracking-widest">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Initiate Cycle
        </>
      )}
    </Button>
  );
}

export function BackgroundCheckForm({ subject }: { subject: Subject }) {
  const plainSubject = useMemo(() => sanitizeForServer(subject), [subject]);
  
  const [state, formAction, isPending] = useActionState(generateReportAction.bind(null, plainSubject), initialState);
  const { toast } = useToast();
  const firestore = useFirestore();
  const lastSavedReportRef = useRef<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<BackgroundCheckSchema>({
    resolver: zodResolver(backgroundCheckSchema),
    defaultValues: {
      criminalRecordCheck: true,
      creditHistoryCheck: false,
      employmentVerification: true,
      southAfricanRegulations: 'Compliance: POPIA / NCA. Requesting verified data.',
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < INVESTIGATIVE_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 1200);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [isPending]);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Cycle Failed',
        description: state.error,
      });
    }

    if (state.report && firestore && lastSavedReportRef.current !== state.report.report) {
      const reportsCollection = collection(firestore, 'subject_profiles', subject.id, 'background_checks');
      const auditCollection = collection(firestore, 'subject_profiles', subject.id, 'audit_log');
      
      const params = {
        criminalRecordCheck: form.getValues('criminalRecordCheck'),
        creditHistoryCheck: form.getValues('creditHistoryCheck'),
        employmentVerification: form.getValues('employmentVerification'),
      };

      addDocumentNonBlocking(reportsCollection, {
        ...state.report,
        timestamp: serverTimestamp(),
        initiatedBy: 'Veritas AI',
        subjectName: subject.name,
        subjectIdNumber: subject.idNumber,
        parameters: params
      });

      addDocumentNonBlocking(auditCollection, {
        action: 'Cycle Completed',
        timestamp: serverTimestamp(),
        analyst: 'System Agent',
        status: 'Success'
      });

      lastSavedReportRef.current = state.report.report;
      
      toast({
        title: "Intelligence Archived",
        description: "Dossier synchronized.",
      });
    }
  }, [state.error, state.report, toast, firestore, subject.id, subject.name, subject.idNumber, form]);

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      <Card className="rounded-none border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <form action={formAction}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-black uppercase tracking-tighter">Parameters</CardTitle>
            <CardDescription className="text-[10px]">Configure search vectors for this cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0 md:pt-0">
            {isPending ? (
              <div className="space-y-4 md:space-y-6 py-4 md:py-8">
                <div className="flex flex-col items-center text-center gap-3">
                  <Activity className="h-8 w-8 md:h-12 md:w-12 text-primary animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-sm font-bold uppercase tracking-tighter text-primary">{INVESTIGATIVE_STEPS[currentStep]}</p>
                    <p className="text-[8px] md:text-xs text-muted-foreground uppercase">Phase #{currentStep + 1}</p>
                  </div>
                </div>
                <Progress value={(currentStep / (INVESTIGATIVE_STEPS.length - 1)) * 100} className="h-1.5" />
                <div className="grid grid-cols-3 gap-1.5">
                   <div className={`flex flex-col items-center p-1.5 rounded-none border text-[8px] ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'opacity-30'}`}>
                      <Globe className="h-3 w-3 mb-0.5" /> ID
                   </div>
                   <div className={`flex flex-col items-center p-1.5 rounded-none border text-[8px] ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'opacity-30'}`}>
                      <Search className="h-3 w-3 mb-0.5" /> S-REC
                   </div>
                   <div className={`flex flex-col items-center p-1.5 rounded-none border text-[8px] ${currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'opacity-30'}`}>
                      <Database className="h-3 w-3 mb-0.5" /> FIN
                   </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vectors</Label>
                  <div className="flex items-center space-x-2 rounded-none border-2 border-primary/20 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Checkbox id="criminalRecordCheck" name="criminalRecordCheck" defaultChecked={form.getValues('criminalRecordCheck')} />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="criminalRecordCheck" className="text-xs font-black uppercase tracking-tight">Criminal Search</Label>
                      <p className="text-[9px] text-muted-foreground uppercase">SAPS CRC Gateway</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-none border-2 border-primary/20 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Checkbox id="creditHistoryCheck" name="creditHistoryCheck" defaultChecked={form.getValues('creditHistoryCheck')} />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="creditHistoryCheck" className="text-xs font-black uppercase tracking-tight">Financial Search</Label>
                      <p className="text-[9px] text-muted-foreground uppercase">TransUnion Bureau</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="southAfricanRegulations" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Directives</Label>
                  <Textarea
                    id="southAfricanRegulations"
                    name="southAfricanRegulations"
                    defaultValue={form.getValues('southAfricanRegulations')}
                    className="min-h-[60px] md:min-h-[80px] resize-none text-[10px] rounded-none border-2"
                  />
                </div>
              </>
            )}
          </CardContent>
          {!isPending && (
            <CardFooter className="p-4 md:p-6 pt-0">
              <SubmitButton />
            </CardFooter>
          )}
        </form>
      </Card>
      
      {state.report ? (
        <Card className="flex flex-col border-2 border-primary bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg font-black uppercase tracking-tighter">Output</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1 bg-background text-[8px] h-5 rounded-none font-black">
                <Save className="h-2.5 w-2.5" /> ARCHIVED
              </Badge>
            </div>
            <CardDescription className="text-[10px]">Synthesized findings.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 md:space-y-6 overflow-auto p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-primary/10 pb-2">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Confidence</span>
                    <span className="text-sm font-black text-primary">{state.report.verificationScore}%</span>
                </div>
                <div className="rounded-none bg-background p-4 md:p-6 shadow-sm border-2 border-primary/20">
                    <h3 className="font-black text-[9px] uppercase tracking-widest mb-3 text-muted-foreground border-b pb-1">Narrative</h3>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-serif italic text-foreground/80">{state.report.report}</p>
                </div>
                <div className="rounded-none border-l-4 border-primary bg-background p-3 md:p-4 shadow-sm">
                    <h3 className="font-black text-[9px] uppercase tracking-widest mb-0.5 text-primary">Risk Factor</h3>
                    <p className="text-xs md:text-sm font-black uppercase">{state.report.riskAssessment}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="flex items-center justify-center min-h-[300px] md:min-h-[400px] border-dashed rounded-none border-2">
            <div className="text-center p-6 md:p-8">
                <div className="mx-auto h-12 w-12 md:h-16 md:w-16 rounded-none bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tighter">Standby</h3>
                <p className="mt-2 text-[9px] md:text-sm text-muted-foreground max-w-[200px] mx-auto uppercase font-bold">
                  Initiate cycle to pull live data.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
}
