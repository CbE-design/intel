'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const initialState = {};

const INVESTIGATIVE_STEPS = [
  "Initializing Secure Intelligence Tunnel...",
  "Querying DHA Identity Gateways...",
  "Cross-referencing SAPS Criminal Record Centre...",
  "Analyzing TransUnion Financial Risk Profile...",
  "Verifying Professional Credentials via SAQA...",
  "Synthesizing GenAI Risk Model...",
  "Finalizing Dossier Archive..."
];

function SubmitButton({ isProcessing }: { isProcessing: boolean }) {
  const { pending } = useFormStatus();
  const loading = pending || isProcessing;

  return (
    <Button type="submit" disabled={loading} className="w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Active Investigative Cycle...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Initiate Full Intelligence Cycle
        </>
      )}
    </Button>
  );
}

export function BackgroundCheckForm({ subject }: { subject: Subject }) {
  const [state, formAction] = useActionState(generateReportAction.bind(null, subject.id), initialState);
  const { toast } = useToast();
  const firestore = useFirestore();
  const lastSavedReportRef = useRef<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<BackgroundCheckSchema>({
    resolver: zodResolver(backgroundCheckSchema),
    defaultValues: {
      criminalRecordCheck: true,
      creditHistoryCheck: false,
      employmentVerification: true,
      southAfricanRegulations: 'In accordance with POPIA and the National Credit Act. Requesting live verification from DHA, SAPS, and NCR registers.',
    },
  });

  // Handle fake progress steps
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < INVESTIGATIVE_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
    }
  }, [isProcessing]);

  const handleSubmit = async (formData: FormData) => {
    setIsProcessing(true);
    // The actual action will run after this
    formAction(formData);
  };

  useEffect(() => {
    if (state.error || state.report) {
      setIsProcessing(false);
    }

    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Intelligence Analysis Failed',
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

      // Save Report
      addDocumentNonBlocking(reportsCollection, {
        ...state.report,
        timestamp: serverTimestamp(),
        initiatedBy: 'System AI',
        subjectName: subject.name,
        subjectIdNumber: subject.idNumber,
        parameters: params
      });

      // Save Audit Entry
      addDocumentNonBlocking(auditCollection, {
        action: 'Intelligence Cycle Completed',
        timestamp: serverTimestamp(),
        analyst: 'Veritas AI Agent',
        status: 'Success'
      });

      lastSavedReportRef.current = state.report.report;
      toast({
        title: "Intelligence Archived",
        description: "The verified findings have been added to the subject history.",
      });
    }
  }, [state.error, state.report, toast, firestore, subject.id, subject.name, subject.idNumber, form]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <form action={handleSubmit}>
          <CardHeader>
            <CardTitle>Initiate Investigation</CardTitle>
            <CardDescription>Configure search parameters for this active intelligence cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isProcessing ? (
              <div className="space-y-6 py-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <Activity className="h-12 w-12 text-primary animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-tighter text-primary">{INVESTIGATIVE_STEPS[currentStep]}</p>
                    <p className="text-xs text-muted-foreground">Cycle #00{currentStep + 1} - Encryption active</p>
                  </div>
                </div>
                <Progress value={(currentStep / (INVESTIGATIVE_STEPS.length - 1)) * 100} className="h-2" />
                <div className="grid grid-cols-3 gap-2">
                   <div className={`flex flex-col items-center p-2 rounded border text-[10px] ${currentStep >= 1 ? 'border-primary/50 bg-primary/5 text-primary' : 'opacity-30'}`}>
                      <Globe className="h-4 w-4 mb-1" /> IDENTITY
                   </div>
                   <div className={`flex flex-col items-center p-2 rounded border text-[10px] ${currentStep >= 2 ? 'border-primary/50 bg-primary/5 text-primary' : 'opacity-30'}`}>
                      <Search className="h-4 w-4 mb-1" /> RECORDS
                   </div>
                   <div className={`flex flex-col items-center p-2 rounded border text-[10px] ${currentStep >= 3 ? 'border-primary/50 bg-primary/5 text-primary' : 'opacity-30'}`}>
                      <Database className="h-4 w-4 mb-1" /> FINANCIAL
                   </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search Vectors</Label>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <Checkbox id="criminalRecordCheck" name="criminalRecordCheck" defaultChecked={form.getValues('criminalRecordCheck')} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="criminalRecordCheck" className="text-sm font-medium">Criminal Database Search</Label>
                      <p className="text-xs text-muted-foreground">National database screening for active warrants.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <Checkbox id="creditHistoryCheck" name="creditHistoryCheck" defaultChecked={form.getValues('creditHistoryCheck')} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="creditHistoryCheck" className="text-sm font-medium">Financial Bureau Search</Label>
                      <p className="text-xs text-muted-foreground">Comprehensive financial integrity assessment.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <Checkbox id="employmentVerification" name="employmentVerification" defaultChecked={form.getValues('employmentVerification')} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="employmentVerification" className="text-sm font-medium">Credential Verification</Label>
                      <p className="text-xs text-muted-foreground">Past employment and professional standing.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="southAfricanRegulations" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Directive</Label>
                  <Textarea
                    id="southAfricanRegulations"
                    name="southAfricanRegulations"
                    defaultValue={form.getValues('southAfricanRegulations')}
                    className="min-h-[80px] resize-none text-xs"
                  />
                </div>
              </>
            )}
          </CardContent>
          {!isProcessing && (
            <CardFooter>
              <SubmitButton isProcessing={isProcessing} />
            </CardFooter>
          )}
        </form>
      </Card>
      
      {state.report ? (
        <Card className="flex flex-col border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Intelligence Output</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1 bg-background">
                <Save className="h-3 w-3" /> ARCHIVED
              </Badge>
            </div>
            <CardDescription>Synthesized findings from the latest cycle.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 overflow-auto">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Dossier Confidence</span>
                    <span className="text-sm font-bold text-primary">{state.report.verificationScore}%</span>
                </div>
                <div className="rounded-lg bg-background p-6 shadow-sm border">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest mb-4 text-muted-foreground border-b pb-2">Investigative Narrative</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif italic text-foreground/80">{state.report.report}</p>
                </div>
                <div className="rounded-lg border-l-4 border-primary bg-background p-4 shadow-sm">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest mb-1 text-primary">Risk Determination</h3>
                    <p className="text-sm font-bold">{state.report.riskAssessment}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="flex items-center justify-center min-h-[400px] border-dashed">
            <div className="text-center p-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Cycle Status: Standby</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[250px] mx-auto">
                  Configure search vectors and initiate the cycle to pull live data.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
}
