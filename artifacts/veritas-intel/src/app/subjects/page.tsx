'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectsList } from '@/components/subjects-list';
import { useSubjects } from '@/lib/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SubjectsPage() {
  const { data: subjects, isLoading, refresh } = useSubjects();

  return (
    <AppLayout>
      <PageHeader title="Subject Database" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
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
            subjects && <SubjectsList subjects={subjects} onDeleted={refresh} />
          )}
        </div>
      </main>
    </AppLayout>
  );
}
