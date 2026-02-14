'use client';

import { useActionState, useFormStatus, useEffect, useRef } from 'react';
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
import { Loader2, FileText, Save } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
          <FileText className="mr-2 h-4 w-4" />
          Generate Background Report
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
      southAfricanRegulations: 'Compliant with the National Credit Act (NCA) and Protection of Personal Information Act (POPIA).',
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

    // Auto-save the generated report to Firestore
    if (state.report && firestore && lastSavedReportRef.current !== state.report.report) {
      const reportsCollection = collection(firestore, 'subject_profiles', subject.id, 'background_checks');
      addDocumentNonBlocking(reportsCollection, {
        ...state.report,
        timestamp: serverTimestamp(),
        initiatedBy: 'System AI',
        subjectName: subject.name,
        subjectIdNumber: subject.idNumber,
      });
      lastSavedReportRef.current = state.report.report;
      toast({
        title: "Report Persistent",
        description: "The background report has been saved to the subject's history.",
      });
    }
  }, [state.error, state.report, toast, firestore, subject.id, subject.name, subject.idNumber]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Initiate Investigation</CardTitle>
            <CardDescription>Configure search parameters and regulatory framework.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Search Vectors</Label>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="criminalRecordCheck" name="criminalRecordCheck" defaultChecked={form.formState.defaultValues?.criminalRecordCheck} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="criminalRecordCheck" className="text-sm font-medium">Criminal Record Database</Label>
                  <p className="text-xs text-muted-foreground">National SAPS database screening.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="creditHistoryCheck" name="creditHistoryCheck" defaultChecked={form.formState.defaultValues?.creditHistoryCheck} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="creditHistoryCheck" className="text-sm font-medium">Financial Integrity Check</Label>
                  <p className="text-xs text-muted-foreground">Credit bureau and financial risk assessment.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <Checkbox id="employmentVerification" name="employmentVerification" defaultChecked={form.formState.defaultValues?.employmentVerification} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="employmentVerification" className="text-sm font-medium">Professional Verification</Label>
                  <p className="text-xs text-muted-foreground">Employment history and credential validation.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="southAfricanRegulations">Legal Framework Context</Label>
              <Textarea
                id="southAfricanRegulations"
                name="southAfricanRegulations"
                placeholder="Specify relevant regulations (e.g., POPIA, FICA)..."
                defaultValue={form.formState.defaultValues?.southAfricanRegulations}
                className="min-h-[100px] resize-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state.report ? (
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Intelligence Output</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Save className="h-3 w-3" /> Auto-saved
              </Badge>
            </div>
            <CardDescription>AI-generated findings and operational risk assessment.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-auto">
            <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 text-muted-foreground">Detailed Summary</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{state.report.report}</p>
            </div>
            <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 text-primary">Risk Assessment</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{state.report.riskAssessment}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="flex items-center justify-center min-h-[400px]">
            <div className="text-center p-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Active Report</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[250px] mx-auto">
                  Configure search parameters and click generate to initiate AI background analysis.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
}
