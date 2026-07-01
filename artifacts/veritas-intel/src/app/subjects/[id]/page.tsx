'use client';
import { Link, useParams, useLocation } from 'wouter';
import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSubject } from '@/lib/use-api';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectDetailTabs } from '@/components/subject-detail-tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, navigate] = useLocation();

  const { data: subject, isLoading } = useSubject(id);

  useEffect(() => {
    if (!isLoading && subject === null) {
      const timer = setTimeout(() => navigate('/subjects'), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, subject, navigate]);

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
                <AvatarImage src={subject.avatarUrl} alt={subject.name} />
                <AvatarFallback>{subject.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold">{subject.name}</div>
                <div className="text-xs text-muted-foreground">{subject.idNumber}</div>
              </div>
            </div>
          )}
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
