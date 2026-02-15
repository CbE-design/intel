'use client';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, AlertCircle, Clock, Loader2, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isUserLoading } = useUser();
  const firestore = useFirestore();

  const subjectsQuery = useMemoFirebase(
    () => (firestore && !isUserLoading ? query(collection(firestore, 'subject_profiles')) : null),
    [firestore, isUserLoading]
  );
  const { data: subjects, isLoading: isCollectionLoading } = useCollection<Subject>(subjectsQuery);

  const recentSubjectsQuery = useMemoFirebase(
    () => (firestore && !isUserLoading ? query(collection(firestore, 'subject_profiles'), orderBy('lastCheck', 'desc'), limit(5)) : null),
    [firestore, isUserLoading]
  );
  const { data: recentSubjects } = useCollection<Subject>(recentSubjectsQuery);

  const isLoading = isUserLoading || isCollectionLoading;

  const stats = {
    total: subjects?.length || 0,
    review: subjects?.filter(s => s.status === 'Review').length || 0,
    pending: subjects?.filter(s => s.status === 'Pending').length || 0,
  };

  return (
    <AppLayout>
      <PageHeader title="Intelligence Command" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isUserLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Authenticating investigator...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}</div>
                  <p className="text-xs text-muted-foreground">Active profiles in database</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged for Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.review}</div>
                  <p className="text-xs text-muted-foreground">Requires investigator attention</p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Checks</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Background checks in progress</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Operational Overview</CardTitle>
                        <CardDescription>Summary of recent intelligence activities.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Compliance Monitoring</p>
                                    <p className="text-xs text-muted-foreground">All investigative flows are currently POPIA and NCA compliant.</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Network Latency</p>
                                    <p className="text-xs text-muted-foreground">Intelligence gateways (MIE, TransUnion) are operating at normal speeds.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest subject updates.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/subjects">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                            ) : (
                                recentSubjects?.map((subject) => (
                                    <div key={subject.id} className="flex items-center justify-between">
                                        <div className="grid gap-0.5">
                                            <p className="text-sm font-medium">{subject.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{subject.idNumber}</p>
                                        </div>
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            subject.status === 'Clear' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            subject.status === 'Review' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        }`}>
                                            {subject.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
