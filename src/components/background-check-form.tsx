'use client';

import { useActionState, useFormStatus, useEffect } from 'react';
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
import { Loader2, FileText } from 'lucide-react';

const initialState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generate Report
    </Button>
  );
}

export function BackgroundCheckForm({ subject }: { subject: Subject }) {
  const [state, formAction] = useActionState(generateReportAction.bind(null, subject.id), initialState);
  const { toast } = useToast();

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
        title: 'Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>New Background Check</CardTitle>
            <CardDescription>Configure parameters for the background check.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Check Parameters</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="criminalRecordCheck" name="criminalRecordCheck" defaultChecked={form.formState.defaultValues?.criminalRecordCheck} />
                <Label htmlFor="criminalRecordCheck">Criminal Record Check</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="creditHistoryCheck" name="creditHistoryCheck" defaultChecked={form.formState.defaultValues?.creditHistoryCheck} />
                <Label htmlFor="creditHistoryCheck">Credit History Check</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="employmentVerification" name="employmentVerification" defaultChecked={form.formState.defaultValues?.employmentVerification} />
                <Label htmlFor="employmentVerification">Employment Verification</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="southAfricanRegulations">South African Regulations</Label>
              <Textarea
                id="southAfricanRegulations"
                name="southAfricanRegulations"
                placeholder="Specify relevant regulations..."
                defaultValue={form.formState.defaultValues?.southAfricanRegulations}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state.report ? (
        <Card>
          <CardHeader>
            <CardTitle>Generated Report</CardTitle>
            <CardDescription>AI-generated summary and risk assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Report Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.report.report}</p>
            </div>
            <div className="mt-4">
                <h3 className="font-semibold mb-2">Risk Assessment</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.report.riskAssessment}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="flex items-center justify-center">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">The generated report will appear here.</p>
            </div>
        </Card>
      )}
    </div>
  );
}
