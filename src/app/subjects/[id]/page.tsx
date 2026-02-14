'use client';
import Link from 'next/link';
import { use } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectDetailTabs } from '@/components/subject-detail-tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();
  
  const subjectRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'subject_profiles', id) : null),
    [firestore, id]
  );
  const { data: subject, isLoading } = useDoc<Subject>(subjectRef);

  if (!isLoading && !subject) {
    notFound();
  }

  return (
    <AppLayout>
      <PageHeader title="Subject Details">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Subjects
            </Button>
          </Link>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="grid gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ) : subject ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={subject.avatarUrl}
                  alt={subject.name}
                  data-ai-hint="person"
                />
                <AvatarFallback>{subject.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold">{subject.name}</div>
                <div className="text-xs text-muted-foreground">
                  {subject.id}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : (
            subject && <SubjectDetailTabs subject={subject} />
        )}
      </main>
    </AppLayout>
  );
}
