import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SocialOsintPanel } from '@/components/social-osint-panel';
import { DarkWebPanel } from '@/components/darkweb-panel';

export default function OsintPage() {
  return (
    <AppLayout>
      <PageHeader title="OSINT Terminal" />
      <div className="p-4 md:p-6 space-y-4">
        <SocialOsintPanel />
        <DarkWebPanel />
      </div>
    </AppLayout>
  );
}
