import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SubjectsList } from '@/components/subjects-list';
import { getSubjects } from '@/lib/data';

export default function Home() {
  const subjects = getSubjects();

  return (
    <AppLayout>
      <PageHeader title="Subjects" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <SubjectsList subjects={subjects} />
      </main>
    </AppLayout>
  );
}
