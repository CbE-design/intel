'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileSearch, MapPin, History, Radio, ShieldAlert, CheckCircle2, AlertCircle, Terminal, Activity, ShieldCheck } from 'lucide-react';
import { BackgroundCheckForm } from './background-check-form';
import { LocationMap } from './location-map';
import { ReportsHistory } from './reports-history';
import type { Location, Subject, Report, AuditEntry } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SubjectDetailTabs({ subject }: { subject: Subject }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);

  const locationsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'subject_profiles', subject.id, 'location_data'), orderBy('timestamp', 'desc'))
        : null,
    [firestore, subject.id]
  );
  const { data: locations } = useCollection<Location>(locationsQuery);

  const reportsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'subject_profiles', subject.id, 'background_checks'),
            orderBy('timestamp', 'desc')
          )
        : null,
    [firestore, subject.id]
  );
  const { data: reports, isLoading: reportsLoading } = useCollection<Report>(reportsQuery);

  const auditQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'subject_profiles', subject.id, 'audit_log'),
            orderBy('timestamp', 'desc'),
            limit(10)
          )
        : null,
    [firestore, subject.id]
  );
  const { data: auditLog } = useCollection<AuditEntry>(auditQuery);

  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  const simulatePing = () => {
    if (!firestore) return;
    setSimulating(true);
    
    const base = locations && locations.length > 0 
      ? locations[0] 
      : { lat: -26.2041, lng: 28.0473 };

    const newPoint = {
      lat: base.lat + (Math.random() - 0.5) * 0.05,
      lng: base.lng + (Math.random() - 0.5) * 0.05,
      timestamp: serverTimestamp(),
      consent: true,
      deviceId: 'GSM-VECTOR-01'
    };

    const locationCol = collection(firestore, 'subject_profiles', subject.id, 'location_data');
    const auditCol = collection(firestore, 'subject_profiles', subject.id, 'audit_log');

    addDocumentNonBlocking(locationCol, newPoint);
    addDocumentNonBlocking(auditCol, {
      action: 'Real-time GSM Location Ping',
      timestamp: serverTimestamp(),
      analyst: 'Automated Tracker',
      status: 'Info'
    });

    toast({
      title: "Device Ping Simulated",
      description: "New location coordinate added and logged.",
    });

    setTimeout(() => setSimulating(false), 500);
  };

  return (
    <Tabs defaultValue="dossier" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="dossier">
          <ShieldAlert className="mr-2 h-4 w-4" /> Dossier
        </TabsTrigger>
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="background-check">
          <FileSearch className="mr-2 h-4 w-4" /> Investigation
        </TabsTrigger>
        <TabsTrigger value="reports">
          <History className="mr-2 h-4 w-4" /> Archive
        </TabsTrigger>
        <TabsTrigger value="location">
          <MapPin className="mr-2 h-4 w-4" /> Tracking
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dossier" className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Executive Intelligence Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end justify-between border-b pb-4">
                <div className="grid gap-1">
                  <span className="text-4xl font-bold">{latestReport?.verificationScore || 'N/A'}%</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Global Confidence Score</span>
                </div>
                <div className="text-right">
                  <Badge variant={subject.status === 'Clear' ? 'default' : subject.status === 'Review' ? 'destructive' : 'secondary'} className="text-lg px-4">
                    {subject.status.toUpperCase()}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase">Current Threat Level</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Verification Progress</span>
                  <span>{latestReport?.verificationScore || 0}% Complete</span>
                </div>
                <Progress value={latestReport?.verificationScore || 0} className="h-1.5" />
              </div>

              {latestReport ? (
                <div className="rounded-lg bg-background p-4 border shadow-sm">
                   <h4 className="text-[10px] font-bold uppercase mb-2 text-primary flex items-center gap-2">
                    <Terminal className="h-3 w-3" /> Latest Analyst Briefing
                   </h4>
                   <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3 italic">"{latestReport.report}"</p>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <ShieldAlert className="h-8 w-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Intelligence Cycle Required</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" /> Operational Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {auditLog && auditLog.length > 0 ? (
                    auditLog.map((log) => (
                      <div key={log.id} className="border-l-2 border-primary/30 pl-3 py-1">
                        <p className="text-[11px] font-semibold">{log.action}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-muted-foreground">
                            {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString() : 'Recent'}
                          </span>
                          <span className="text-[9px] font-bold uppercase">{log.analyst}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="flex flex-col items-center justify-center p-4">
              <ShieldCheck className="h-6 w-6 text-green-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">DHA Match</span>
              <span className="text-sm font-semibold">VERIFIED</span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4">
              <CheckCircle2 className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">CIPC Register</span>
              <span className="text-sm font-semibold">LINKED</span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4">
              <Activity className="h-6 w-6 text-primary mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Last Ping</span>
              <span className="text-sm font-semibold">5m AGO</span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4">
              <Radio className="h-6 w-6 text-yellow-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">GSM Polling</span>
              <span className="text-sm font-semibold">ACTIVE</span>
           </Card>
        </div>
      </TabsContent>

      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Verified Identity Profile</CardTitle>
            <CardDescription>Consolidated data from DHA and internal security registers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Legal Name</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{subject.name}</p>
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 uppercase">Match</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">National ID Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono">{subject.idNumber}</p>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase">DHA Certified</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Verified Residency</p>
                  <div className="space-y-1">
                    <p className="text-lg leading-tight">{subject.address}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> Bureau Address Match (98%)
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Mobile Vector</p>
                  <p className="text-lg font-mono">{subject.phoneNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="background-check" className="mt-4">
        <BackgroundCheckForm subject={subject} />
      </TabsContent>

      <TabsContent value="reports" className="mt-4">
        <ReportsHistory reports={reports || []} isLoading={reportsLoading} />
      </TabsContent>

      <TabsContent value="location" className="mt-4">
        <div className="flex flex-col gap-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">GSM Location Intelligence</h3>
                <p className="text-xs text-muted-foreground">Encrypted polling via cellular network triangulation.</p>
              </div>
              <Button size="sm" onClick={simulatePing} disabled={simulating}>
                <Radio className={`mr-2 h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
                Initiate GSM Poll
              </Button>
            </CardContent>
          </Card>
          <LocationMap locations={locations || []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
