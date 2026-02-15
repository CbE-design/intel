'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectsList } from '@/components/subjects-list';
import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Subject } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubjectsPage() {
  const { isUserLoading } = useUser();
  const firestore = useFirestore();

  const subjectsQuery = useMemoFirebase(
    () => (firestore && !isUserLoading ? query(collection(firestore, 'subject_profiles'), orderBy('name', 'asc')) : null),
    [firestore, isUserLoading]
  );
  
  const { data: subjects, isLoading: isCollectionLoading } = useCollection<Subject>(subjectsQuery);

  const isLoading = isUserLoading || isCollectionLoading;

  return (
    <AppLayout>
      <PageHeader title="Subject Database" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isUserLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Accessing intelligence repository...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Investigative Registry</CardTitle>
                    <CardDescription>
                        Manage and monitor subject profiles within the verified Veritas Intel network.
                    </CardDescription>
                </CardHeader>
            </Card>
            
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                subjects && <SubjectsList subjects={subjects} />
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
