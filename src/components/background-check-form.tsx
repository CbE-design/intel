'use client';

import { useActionState, useEffect, useRef } from 'react';
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
import { Loader2, FileText, Save, ShieldCheck } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';

const initialState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing Intelligence...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Initiate Verified Intelligence Cycle
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

  const form = useForm<BackgroundCheckSchema>({
    resolver: zodResolver(backgroundCheckSchema),
    defaultValues: {
      criminalRecordCheck: true,
      creditHistoryCheck: false,
      employmentVerification: true,
      southAfricanRegulations: 'Compliant with the National Credit Act (NCA) and Protection of Personal Information Act (POPIA). Source verification requested from DHA, SAPS, and TransUnion.',
    },
  });

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Intelligence Analysis Failed',
        description: state.error,
      });
    }

    if (state.report && firestore && lastSavedReportRef.current !== state.report.report) {
      const reportsCollection = collection(firestore, 'subject_profiles', subject.id, 'background_checks');
      
      const params = {
        criminalRecordCheck: form.getValues('criminalRecordCheck'),
        creditHistoryCheck: form.getValues('creditHistoryCheck'),
        employmentVerification: form.getValues('employmentVerification'),
      };

      addDocumentNonBlocking(reportsCollection, {
        ...state.report,
        timestamp: serverTimestamp(),
        initiatedBy: 'System AI',
        subjectName: subject.name,
        subjectIdNumber: subject.idNumber,
        parameters: params
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
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Initiate Investigation</CardTitle>
            <CardDescription>Configure search parameters and regulatory framework for this intelligence cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Search Vectors</Label>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="criminalRecordCheck" name="criminalRecordCheck" defaultChecked={form.getValues('criminalRecordCheck')} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="criminalRecordCheck" className="text-sm font-medium">SAPS Criminal Database</Label>
                  <p className="text-xs text-muted-foreground">National database screening for active warrants and records.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="creditHistoryCheck" name="creditHistoryCheck" defaultChecked={form.getValues('creditHistoryCheck')} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="creditHistoryCheck" className="text-sm font-medium">TransUnion Bureau Search</Label>
                  <p className="text-xs text-muted-foreground">Comprehensive financial integrity and credit risk assessment.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="employmentVerification" name="employmentVerification" defaultChecked={form.getValues('employmentVerification')} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="employmentVerification" className="text-sm font-medium">Professional Credentials</Label>
                  <p className="text-xs text-muted-foreground">Past employment verification and professional standing.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="southAfricanRegulations" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Directive</Label>
              <Textarea
                id="southAfricanRegulations"
                name="southAfricanRegulations"
                placeholder="Specify relevant regulations (e.g., POPIA, FICA)..."
                defaultValue={form.getValues('southAfricanRegulations')}
                className="min-h-[100px] resize-none text-xs"
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state.report ? (
        <Card className="flex flex-col border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Intelligence Output</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1 bg-background">
                <Save className="h-3 w-3" /> ARCHIVED
              </Badge>
            </div>
            <CardDescription>Synthesized findings from verified external sources.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 overflow-auto">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Dossier Confidence</span>
                    <span className="text-sm font-bold">{state.report.verificationScore}%</span>
                </div>
                <div className="rounded-lg bg-background p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-muted-foreground border-b pb-2">Analysis Narrative</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif italic text-foreground/80">{state.report.report}</p>
                </div>
                <div className="rounded-lg border-l-4 border-primary bg-background p-4 shadow-sm">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest mb-1 text-primary">Risk Assessment</h3>
                    <p className="text-sm font-semibold">{state.report.riskAssessment}</p>
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
                <h3 className="text-lg font-medium">Pending Investigative Cycle</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[250px] mx-auto">
                  Configure the search vectors and click initiate to perform a live intelligence synthesis.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
}
