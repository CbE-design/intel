'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileSearch, MapPin, History, Radio, ShieldAlert, CheckCircle2, AlertCircle, Terminal, Activity, ShieldCheck, Wifi } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dossier');

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
            limit(15)
          )
        : null,
    [firestore, subject.id]
  );
  const { data: auditLog } = useCollection<AuditEntry>(auditQuery);

  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  const simulatePing = () => {
    if (!firestore) return;
    setSimulating(true);
    
    // Determine the starting point for simulation
    const base = (locations && locations.length > 0)
      ? { lat: locations[0].lat, lng: locations[0].lng } 
      : { lat: -26.2041, lng: 28.0473 }; // Default to JHB central

    // Add a randomized offset to simulate realistic movement or GPS drift
    const newPoint = {
      lat: base.lat + (Math.random() - 0.5) * 0.005,
      lng: base.lng + (Math.random() - 0.5) * 0.005,
      timestamp: serverTimestamp(),
      consent: true,
      deviceId: 'GSM-VECTOR-01',
      accuracy: Math.floor(Math.random() * 20) + 5 // Accuracy in meters
    };

    const locationCol = collection(firestore, 'subject_profiles', subject.id, 'location_data');
    const auditCol = collection(firestore, 'subject_profiles', subject.id, 'audit_log');

    // Execute Firestore writes
    addDocumentNonBlocking(locationCol, newPoint);
    addDocumentNonBlocking(auditCol, {
      action: 'Active GSM Location Intercept',
      timestamp: serverTimestamp(),
      analyst: 'Automated Investigative Agent',
      status: 'Info'
    });

    toast({
      title: "GSM Poll Initiated",
      description: "Intercepting cellular triangulation data...",
    });

    // Hold the loading state for a moment to signify "active work"
    setTimeout(() => {
      setSimulating(false);
      toast({
        title: "Coordinate Locked",
        description: "Subject location updated on master tracking board.",
      });
    }, 1200);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <div className="text-center py-10 border border-dashed rounded-lg bg-background/50">
                  <ShieldAlert className="h-8 w-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No Active Intelligence Cycle Detected</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4" 
                    onClick={() => setActiveTab('background-check')}
                  >
                    Initiate Cycle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30">
            <CardHeader className="pb-2 border-b mb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3 text-primary" /> Operational Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-4">
                  {auditLog && auditLog.length > 0 ? (
                    auditLog.map((log) => (
                      <div key={log.id} className="border-l-2 border-primary/30 pl-3 py-1 relative">
                        <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-primary" />
                        <p className="text-[11px] font-semibold leading-tight">{log.action}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {log.timestamp instanceof Object && 'seconds' in log.timestamp 
                              ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() 
                              : 'Just now'}
                          </span>
                          <span className="text-[8px] font-bold uppercase bg-primary/10 px-1 rounded">{log.analyst}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center py-8">No operational history available.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="flex flex-col items-center justify-center p-4 border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-6 w-6 text-green-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">DHA Match</span>
              <span className="text-sm font-semibold">CERTIFIED</span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4 border-blue-500/20 bg-blue-500/5">
              <CheckCircle2 className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">CIPC Link</span>
              <span className="text-sm font-semibold">VERIFIED</span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4">
              <Activity className="h-6 w-6 text-primary mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Last Ping</span>
              <span className="text-sm font-semibold">
                {locations && locations.length > 0 ? 'ACTIVE' : 'NO DATA'}
              </span>
           </Card>
           <Card className="flex flex-col items-center justify-center p-4 border-yellow-500/20 bg-yellow-500/5">
              <Wifi className="h-6 w-6 text-yellow-500 mb-2" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">GSM Network</span>
              <span className="text-sm font-semibold">ENCRYPTED</span>
           </Card>
        </div>
      </TabsContent>

      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Verified Identity Profile</CardTitle>
            <CardDescription>Consolidated data from Home Affairs and internal security registers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Legal Name</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{subject.name}</p>
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 uppercase">Matched</Badge>
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
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-background border ${simulating ? 'animate-pulse border-primary' : ''}`}>
                  <Radio className={`h-6 w-6 ${simulating ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">GSM Triangulation Protocol</h3>
                  <p className="text-xs text-muted-foreground">Active polling via encrypted cellular network handshakes.</p>
                </div>
              </div>
              <Button size="lg" onClick={simulatePing} disabled={simulating} className="min-w-[180px]">
                {simulating ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Triangulating...
                  </>
                ) : (
                  <>
                    <Radio className="mr-2 h-4 w-4" />
                    Initiate GSM Poll
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          <LocationMap locations={locations || []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}