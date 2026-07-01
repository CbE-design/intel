'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const newSubjectSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  idNumber: z.string().regex(/^[0-9]{13}$/, { message: 'Must be a valid 13-digit South African ID number.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  phoneNumber: z.string().regex(/^\+27[0-9]{9}$/, { message: 'Must be a valid South African phone number, e.g., +27821234567.' }),
});

type NewSubjectForm = z.infer<typeof newSubjectSchema>;

export default function NewSubjectPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<NewSubjectForm>({
    resolver: zodResolver(newSubjectSchema),
    defaultValues: { name: '', idNumber: '', address: '', phoneNumber: '' },
  });

  const onSubmit = async (values: NewSubjectForm) => {
    try {
      await api.subjects.create(values);
      toast({ title: 'Subject Created', description: 'The new subject has been added to the database.' });
      navigate('/subjects');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Create New Subject">
        <Link href="/subjects">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>
        </Link>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="max-w-2xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Subject Details</CardTitle>
            <CardDescription>Enter the personal details of the new subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="idNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl><Input placeholder="9901015000080" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="123 Main St, Johannesburg, 2000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="+27821234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Subject'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
