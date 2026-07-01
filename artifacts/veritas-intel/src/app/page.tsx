'use client';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useSubjects } from '@/lib/use-api';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, AlertCircle, Clock, ShieldCheck, Activity, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: subjects, isLoading } = useSubjects();

  const recentSubjects = subjects ? [...subjects].sort((a, b) => {
    const aTime = new Date(a.lastCheck as string).getTime();
    const bTime = new Date(b.lastCheck as string).getTime();
    return bTime - aTime;
  }).slice(0, 5) : [];

  const stats = {
    total: subjects?.length || 0,
    review: subjects?.filter((s: Subject) => s.status === 'Review').length || 0,
    pending: subjects?.filter((s: Subject) => s.status === 'Pending').length || 0,
    clear: subjects?.filter((s: Subject) => s.status === 'Clear').length || 0,
  };

  return (
    <AppLayout>
      <PageHeader title="Intelligence Command" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium">Subjects</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-8 md:h-8 md:w-12" /> : stats.total}</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest">Registry</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium">Review</CardTitle>
              <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-destructive">{isLoading ? <Skeleton className="h-6 w-8 md:h-8 md:w-12" /> : stats.review}</div>
              <p className="text-[8px] md:text-[9px] text-destructive/60 uppercase font-black tracking-widest">Attention</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-8 md:h-8 md:w-12" /> : stats.pending}</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest">Queue</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium">Clear</CardTitle>
              <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-8 md:h-8 md:w-12" /> : stats.clear}</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest">Verified</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 border-2 border-primary rounded-none">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm md:text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Activity className="h-4 w-4" /> System Status
              </CardTitle>
              <CardDescription className="text-[8px] md:text-[9px] uppercase font-bold opacity-60">Live Intelligence Feed</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">SAPS Gateway</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground font-mono leading-tight">Criminal record query engine active.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Credit Bureau Link</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground font-mono leading-tight">TransUnion SA integration nominal.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Analysis Core</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground font-mono leading-tight">Gemini Intelligence Engine nominal.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Replit DB</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground font-mono leading-tight">PostgreSQL archive engine active.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-2 border-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
              <div>
                <CardTitle className="text-base md:text-lg font-black uppercase tracking-tighter">Latest Pings</CardTitle>
                <CardDescription className="text-[8px] md:text-[10px] font-bold uppercase opacity-60">Recent Intelligence</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 md:h-8 font-black text-[8px] md:text-[9px] uppercase hover:bg-primary hover:text-primary-foreground transition-none border md:border-0">
                <Link href="/subjects">Index</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="space-y-3 md:space-y-4">
                {isLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : (
                  recentSubjects?.map((subject: Subject) => (
                    <div key={subject.id} className="flex items-center justify-between border-b border-primary/10 pb-2 md:pb-3 last:border-0">
                      <div className="grid gap-0.5 max-w-[150px] md:max-w-none">
                        <p className="text-xs md:text-sm font-black uppercase tracking-tighter truncate">{subject.name}</p>
                        <p className="text-[8px] md:text-[9px] text-muted-foreground font-mono uppercase tracking-widest">{subject.idNumber}</p>
                      </div>
                      <div className={`text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-none border-2 ${
                        subject.status === 'Clear' ? 'bg-primary text-primary-foreground border-primary' :
                        subject.status === 'Review' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-muted text-muted-foreground border-primary/20'
                      }`}>
                        {subject.status.toUpperCase()}
                      </div>
                    </div>
                  ))
                )}
                {!isLoading && (!recentSubjects || recentSubjects.length === 0) && (
                  <div className="text-center py-8 text-[10px] uppercase font-black tracking-widest opacity-30">
                    NO RECENT ACTIVITY
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => window.location.href = '/subjects/new'}>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <Users className="h-4 w-4" /> Enroll New Subject
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold opacity-60">Add a new profile to the registry</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="rounded-none font-black uppercase text-[9px] tracking-widest">
                <ArrowRight className="mr-2 h-3 w-3" /> Open Form
              </Button>
            </CardContent>
          </Card>
          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <Zap className="h-4 w-4" /> Research Terminal
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold opacity-60">Launch global intelligence research</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="rounded-none font-black uppercase text-[9px] tracking-widest" asChild>
                <Link href="/research"><ArrowRight className="mr-2 h-3 w-3" /> Open Terminal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
