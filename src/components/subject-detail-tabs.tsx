'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileSearch, MapPin, History, Radio, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { BackgroundCheckForm } from './background-check-form';
import { LocationMap } from './location-map';
import { ReportsHistory } from './reports-history';
import type { Location, Subject, Report } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
      deviceId: 'SIMULATOR-01'
    };

    const locationCol = collection(firestore, 'subject_profiles', subject.id, 'location_data');
    addDocumentNonBlocking(locationCol, newPoint);

    toast({
      title: "Device Ping Simulated",
      description: "New location coordinate added to history.",
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
          <FileSearch className="mr-2 h-4 w-4" /> New Check
        </TabsTrigger>
        <TabsTrigger value="reports">
          <History className="mr-2 h-4 w-4" /> History
        </TabsTrigger>
        <TabsTrigger value="location">
          <MapPin className="mr-2 h-4 w-4" /> Tracking
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dossier" className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Verification Dossier Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-bold">{latestReport?.verificationScore || 'N/A'}%</span>
                <span className="text-xs text-muted-foreground">Confidence Level</span>
              </div>
              <Progress value={latestReport?.verificationScore || 0} className="h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Operational Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {subject.status === 'Clear' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {subject.status === 'Review' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                {subject.status === 'Pending' && <History className="h-5 w-5 text-blue-500" />}
                <span className="text-2xl font-bold">{subject.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Status determined by latest investigative cycle.</p>
            </CardContent>
          </Card>
        </div>

        {latestReport ? (
          <Card>
            <CardHeader>
              <CardTitle>Latest Intelligence Snapshot</CardTitle>
              <CardDescription>Synthesized findings from the most recent investigative cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-xs font-bold uppercase mb-2 text-primary">Executive Findings</h4>
                <p className="text-sm leading-relaxed line-clamp-4">{latestReport.report}</p>
                <Button variant="link" className="px-0 h-auto mt-2 text-xs" onClick={() => {}}>View Full Report</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Verified</p>
                  <p className="text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Risk Assessment</p>
                  <p className="text-sm font-semibold">{latestReport.riskAssessment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted mb-4" />
            <CardTitle>No Intelligence Data</CardTitle>
            <CardDescription className="max-w-[300px] mt-2">
              No investigative reports have been generated for this subject. Initiate a new check to build the dossier.
            </CardDescription>
          </Card>
        )}
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
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{subject.name}</p>
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">MATCH</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">National ID Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono">{subject.idNumber}</p>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">DHA VERIFIED</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Residential Address</p>
                  <div className="space-y-1">
                    <p className="text-lg leading-tight">{subject.address}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> CIPC Registered Office Match
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Mobile Vector</p>
                  <p className="text-lg">{subject.phoneNumber}</p>
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
                <h3 className="font-semibold text-sm">Location Intelligence</h3>
                <p className="text-xs text-muted-foreground">Forced polling of subject device via GSM triangulation.</p>
              </div>
              <Button size="sm" onClick={simulatePing} disabled={simulating}>
                <Radio className={`mr-2 h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
                Force Device Poll
              </Button>
            </CardContent>
          </Card>
          <LocationMap locations={locations || []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
