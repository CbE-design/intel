'use client';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, AlertCircle, Clock, Loader2, ShieldCheck, Activity, Zap, Globe, ArrowRight } from 'lucide-react';
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
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}</div>
                  <p className="text-xs text-muted-foreground uppercase font-black text-[9px]">Registry Nodes</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged for Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.review}</div>
                  <p className="text-xs text-destructive/60 uppercase font-black text-[9px]">Critical Attention</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Checks</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.pending}</div>
                  <p className="text-xs text-muted-foreground uppercase font-black text-[9px]">Active Investigations</p>
                </CardContent>
              </Card>
              <Card className="border-primary bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-tighter">Research Hub</CardTitle>
                  <Zap className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" className="w-full rounded-none font-black text-[10px] uppercase h-8" asChild>
                    <Link href="/research">Open Terminal <ArrowRight className="ml-2 h-3 w-3" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-2 border-primary rounded-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Operational Directives</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase opacity-60">System Health & Compliance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-none border-2 border-primary/20 p-4 bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-none border border-primary/20">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Compliance Locked</p>
                                    <p className="text-[10px] text-muted-foreground font-mono leading-tight">POPIA and NCA gateways are operating in verified mode. Data integrity confirmed.</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-none border-2 border-primary/20 p-4 bg-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-none border border-primary/20">
                                    <Globe className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary">Global Research Node</p>
                                    <p className="text-[10px] text-muted-foreground font-mono leading-tight">Forensic criminology engine is synced with latest global MO databases. Unrestricted override active.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-2 border-primary rounded-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Recent Subjects</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase opacity-60">Latest Intelligence Pings</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="font-black text-[9px] uppercase hover:bg-primary hover:text-primary-foreground transition-none">
                            <Link href="/subjects">Registry Index</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                            ) : (
                                recentSubjects?.map((subject) => (
                                    <div key={subject.id} className="flex items-center justify-between border-b border-primary/10 pb-3 last:border-0">
                                        <div className="grid gap-0.5">
                                            <p className="text-sm font-black uppercase tracking-tighter">{subject.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">{subject.idNumber}</p>
                                        </div>
                                        <div className={`text-[8px] font-black px-2 py-0.5 rounded-none border-2 ${
                                            subject.status === 'Clear' ? 'bg-primary text-primary-foreground border-primary' :
                                            subject.status === 'Review' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                            'bg-muted text-muted-foreground border-primary/20'
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
