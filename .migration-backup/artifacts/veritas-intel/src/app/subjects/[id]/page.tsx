'use client';
import { Link, useParams, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectDetailTabs } from '@/components/subject-detail-tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, navigate] = useLocation();
  const { isUserLoading } = useUser();
  const firestore = useFirestore();
  const [should404, setShould404] = useState(false);

  const subjectRef = useMemoFirebase(
    () => (firestore && !isUserLoading ? doc(firestore, 'subject_profiles', id) : null),
    [firestore, id, isUserLoading]
  );
  const { data: subject, isLoading: isDocLoading } = useDoc<Subject>(subjectRef);

  const isLoading = isUserLoading || isDocLoading;

  useEffect(() => {
    if (!isLoading && firestore && subject === null) {
      const timer = setTimeout(() => setShould404(true), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, subject, firestore]);

  useEffect(() => {
    if (should404) {
      navigate('/subjects');
    }
  }, [should404, navigate]);

  return (
    <AppLayout>
      <PageHeader title="Subject Intelligence">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/subjects">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Subjects
            </Link>
          </Button>
          {isLoading || !subject ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="grid gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={subject.avatarUrl}
                  alt={subject.name}
                />
                <AvatarFallback>{subject.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold">{subject.name}</div>
                <div className="text-xs text-muted-foreground">
                  {subject.idNumber}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isUserLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Verifying access...</span>
          </div>
        ) : isDocLoading ? (
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
