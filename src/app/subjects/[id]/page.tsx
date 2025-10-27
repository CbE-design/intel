import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectDetailTabs } from '@/components/subject-detail-tabs';
import { getSubjectById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';

export default function SubjectPage({ params }: { params: { id: string } }) {
  const subject = getSubjectById(params.id);

  if (!subject) {
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
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={subject.avatarUrl} alt={subject.name} data-ai-hint="person" />
              <AvatarFallback>{subject.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5">
              <div className="font-semibold">{subject.name}</div>
              <div className="text-xs text-muted-foreground">{subject.id}</div>
            </div>
          </div>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <SubjectDetailTabs subjectId={params.id} />
      </main>
    </AppLayout>
  );
}
