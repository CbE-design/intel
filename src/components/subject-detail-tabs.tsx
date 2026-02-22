'use client';

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, FileSearch, MapPin, History, Radio, ShieldAlert, 
  Terminal, Activity, ShieldCheck, Search, Building2,
  Cpu, Layers, Shield, Fingerprint, Globe, Mail, Phone,
  Database, Zap, AlertTriangle, Key, Server, MessageSquareQuote,
  Scale
} from 'lucide-react';
import { BackgroundCheckForm } from './background-check-form';
import { LocationMap } from './location-map';
import { ReportsHistory } from './reports-history';
import { IntelligenceChat } from './intelligence-chat';
import type { Location, Subject, Report, AuditEntry, CorporateLinkage, OSINTMatch } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCorporateLinkages, getOSINTMatches, performRICAReview } from '@/lib/intelligence-service';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { performDeepSearchAction } from '@/lib/actions';
import { format } from 'date-fns';
import { sanitizeForServer } from '@/lib/utils';

export function SubjectDetailTabs({ subject }: { subject: Subject }) {
  const [mounted, setMounted] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier');
  const [corporateData, setCorporateData] = useState<CorporateLinkage[]>([]);
  const [osintData, setOsintData] = useState<OSINTMatch[]>([]);
  const [ricaData, setRicaData] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plainSubject = useMemo(() => sanitizeForServer(subject), [subject]);

  const [deepSearchState, deepSearchAction, isDeepSearching] = useActionState(
    performDeepSearchAction.bind(null, plainSubject),
    {}
  );

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

  useEffect(() => {
    async function fetchIntel() {
      if (!mounted) return;
      setLoadingIntel(true);
      try {
        const [corp, osint, rica] = await Promise.all([
          getCorporateLinkages(subject.idNumber),
          getOSINTMatches(subject.name, subject.idNumber),
          performRICAReview(subject.phoneNumber, subject.idNumber)
        ]);
        setCorporateData(corp);
        setOsintData(osint);
        setRicaData(rica);
      } catch (e) {
        console.error("Intel fetch failed", e);
      } finally {
        setLoadingIntel(false);
      }
    }
    fetchIntel();
  }, [subject.idNumber, subject.name, subject.phoneNumber, mounted]);

  useEffect(() => {
    if (deepSearchState.result && firestore) {
      addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'audit_log'), {
        action: `ACTIVE DISCOVERY FINALIZED. BREACHES: ${deepSearchState.result.breachResults?.length || 0}. RISK: ${deepSearchState.result.overallRiskScore}%`,
        timestamp: serverTimestamp(),
        analyst: 'OSINT GATEWAY',
        status: 'Success'
      });
      toast({
        title: "Active Intelligence Archived",
        description: "Breach data and digital footprints synchronized.",
      });
    }
  }, [deepSearchState, firestore, subject.id, toast]);

  const latestReport = reports && reports.length > 0 ? reports[0] : null;
  const latestLocation = locations && locations.length > 0 ? locations[0] : null;

  const chartData = useMemo(() => {
    if (!mounted || !reports) return [];
    return reports.slice().reverse().map(r => ({
      date: r.timestamp instanceof Object && 'seconds' in (r.timestamp as any) 
        ? format(new Date((r.timestamp as any).seconds * 1000), 'MM/dd')
        : 'Prev',
      score: r.verificationScore
    }));
  }, [reports, mounted]);

  const simulatePing = () => {
    if (!firestore) return;
    setSimulating(true);
    
    const base = latestLocation ? { lat: latestLocation.lat, lng: latestLocation.lng } : { lat: -26.2041, lng: 28.0473 };
    const newLat = base.lat + (Math.random() - 0.5) * 0.008;
    const newLng = base.lng + (Math.random() - 0.5) * 0.008;
    
    addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'location_data'), { 
      lat: newLat, 
      lng: newLng, 
      timestamp: serverTimestamp(), 
      consent: true, 
      deviceId: 'GSM-ACTIVE-01' 
    });
    
    setTimeout(() => {
      setSimulating(false);
      toast({ title: "Live Vector Lock Established", description: `${newLat.toFixed(4)}, ${newLng.toFixed(4)}` });
    }, 1500);
  };

  const currentDossierContext = useMemo(() => {
    let context = "";
    if (latestReport) context += `Latest Report: ${latestReport.report}\nRisk: ${latestReport.riskAssessment}\n`;
    if (ricaData) context += `RICA Status: ${ricaData.status}\n`;
    if (deepSearchState.result) context += `Breaches: ${JSON.stringify(deepSearchState.result.breachResults)}\nSummary: ${deepSearchState.result.summary}\n`;
    return context;
  }, [latestReport, ricaData, deepSearchState.result]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <ScrollArea className="w-full border-b bg-black/10 dark:bg-white/5">
        <TabsList className="inline-flex w-full md:grid md:grid-cols-8 h-12 p-1 rounded-none bg-transparent">
          <TabsTrigger value="dossier" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <ShieldAlert className="mr-1.5 h-3 w-3" /> Dossier
          </TabsTrigger>
          <TabsTrigger value="interrogate" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <MessageSquareQuote className="mr-1.5 h-3 w-3" /> Interrogate
          </TabsTrigger>
          <TabsTrigger value="deep-research" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4 bg-primary/10 text-primary">
            <Scale className="mr-1.5 h-3 w-3" /> Deep Research
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <User className="mr-1.5 h-3 w-3" /> Identity
          </TabsTrigger>
          <TabsTrigger value="osint" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <Globe className="mr-1.5 h-3 w-3" /> OSINT
          </TabsTrigger>
          <TabsTrigger value="background-check" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <FileSearch className="mr-1.5 h-3 w-3" /> Investigation
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <History className="mr-1.5 h-3 w-3" /> Archive
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-none uppercase text-[9px] font-bold tracking-widest whitespace-nowrap px-4">
            <MapPin className="mr-1.5 h-3 w-3" /> Vector
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <TabsContent value="interrogate" className="mt-4 md:mt-6">
        <IntelligenceChat subject={subject} dossierContext={currentDossierContext} />
      </TabsContent>

      <TabsContent value="deep-research" className="mt-4 md:mt-6">
        <IntelligenceChat subject={subject} dossierContext={`${currentDossierContext}\nTask: Conduct exhaustive criminological research on potential criminal associations and MO patterns relevant to this profile.`} />
      </TabsContent>

      <TabsContent value="dossier" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <Card className="border-2 border-primary bg-background md:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" /> Command Center
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-primary font-bold">READY</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8 pt-6">
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Confidence</span>
                  <span className="text-4xl md:text-6xl font-black tracking-tighter">{latestReport?.verificationScore || '0'}%</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[8px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</span>
                  <div className={`mt-1 md:mt-2 text-lg md:text-2xl font-black px-3 md:px-4 py-0.5 md:py-1 uppercase border-2 ${subject.status === 'Clear' ? 'border-primary' : 'border-destructive text-destructive'}`}>
                    {subject.status}
                  </div>
                </div>
              </div>

              {mounted && chartData.length > 0 && (
                <div className="h-[100px] md:h-[120px] w-full border p-2 md:p-4 bg-muted/5">
                   <ChartContainer config={{ score: { label: "Score", color: "hsl(var(--primary))" } }}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary)/0.1)" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                   </ChartContainer>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="p-2 md:p-3 border bg-muted/5">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">Breach</p>
                    <p className="text-lg md:text-xl font-black">{deepSearchState.result?.breachResults?.length || 0}</p>
                  </div>
                  <div className="p-2 md:p-3 border bg-muted/5">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">CIPC</p>
                    <p className="text-lg md:text-xl font-black">{corporateData.length}</p>
                  </div>
                  <div className="p-2 md:p-3 border bg-muted/5">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">RICA</p>
                    <p className="text-lg md:text-xl font-black">{ricaData?.status === 'Verified' ? 'PASS' : 'NULL'}</p>
                  </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black text-white shadow-lg h-[300px] md:h-auto">
            <CardHeader className="pb-3 md:pb-4 border-b border-white/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-3 w-3 animate-pulse text-primary" /> Operational Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 md:pt-4">
              <ScrollArea className="h-[230px] md:h-[400px]">
                <div className="space-y-3 md:space-y-4 pr-4">
                  {mounted && auditLog?.map((log) => (
                    <div key={log.id} className="border-l border-white/20 pl-3 py-1">
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-tight">{log.action}</p>
                      <span className="text-[6px] md:text-[7px] opacity-50 font-mono">
                        {log.timestamp instanceof Object && 'seconds' in (log.timestamp as any) ? format(new Date((log.timestamp as any).seconds * 1000), 'HH:mm:ss') : 'LIVE'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="osint" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
        <Card className="border-2 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> OSINT Gateway
              </CardTitle>
              <form action={deepSearchAction}>
                <Button size="sm" disabled={isDeepSearching} className="rounded-none font-black h-8 w-full md:w-auto">
                  {isDeepSearching ? <Activity className="animate-spin h-3 w-3 mr-2" /> : <Shield className="h-3 w-3 mr-2" />}
                  {isDeepSearching ? 'INITIATING CRAWL...' : 'START LIVE DISCOVERY'}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 md:space-y-6">
                 {deepSearchState.result && (
                   <div className="bg-black text-white p-4 md:p-6 font-mono text-[8px] md:text-[9px] h-48 md:h-64 overflow-auto border-l-4 md:border-l-8 border-primary">
                     <p className="text-primary mb-1 md:mb-2"># VERITAS ACTIVE DISCOVERY V5.0</p>
                     <p># RUNNING SHERLOCK USERNAME CRAWL...</p>
                     {deepSearchState.result.sherlockResults.filter(r => r.exists).map((r, i) => (
                       <p key={i} className="text-primary">[FOUND] {r.site} :: {r.url}</p>
                     ))}
                     <p className="mt-2"># CHECKING LEAK DATABASES (HIBP/LEAKCHECK)...</p>
                     {deepSearchState.result.breachResults.map((b, i) => (
                       <p key={i} className="text-destructive">[BREACH] {b.name} ({b.breachDate})</p>
                     ))}
                     <p className="mt-2"># RICA HANDSHAKE VERIFIED.</p>
                     <p className="opacity-50"># DISCOVERY CYCLE COMPLETE.</p>
                   </div>
                 )}

                 {deepSearchState.result ? (
                   <div className="p-4 md:p-6 bg-muted/10 border-l-4 border-primary italic text-xs md:text-sm">
                     "{deepSearchState.result.summary}"
                   </div>
                 ) : (
                   <div className="h-48 md:h-64 flex items-center justify-center border-2 border-dashed">
                     <p className="text-[9px] md:text-[10px] font-black uppercase opacity-30">Waiting for discovery...</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4 md:space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Database className="h-3 w-3" /> Intelligence Points
                 </h4>
                 {deepSearchState.result?.breachResults?.map((breach, i) => (
                   <div key={i} className="p-3 md:p-4 border bg-background space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-black text-[10px] md:text-xs uppercase truncate">{breach.name}</span>
                        <Badge variant="destructive" className="text-[7px] md:text-[8px] h-4">LEAKED</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {breach.dataClasses.map((c, j) => (
                          <Badge key={j} variant="outline" className="text-[6px] md:text-[7px] uppercase h-4">{c}</Badge>
                        ))}
                      </div>
                   </div>
                 ))}
                 
                 <div className="pt-4 border-t space-y-3 md:space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Server className="h-3 w-3" /> Infrastructure Recon
                    </h4>
                    <div className="p-3 md:p-4 border bg-muted/5 font-mono text-[8px] md:text-[9px] space-y-1">
                      <p>IP_ENDPOINT: 102.165.4.12</p>
                      <p>ACTIVE_PORTS: 80, 443, 8080</p>
                      <p>VULNS: CVE-2023-44487 (HIGH)</p>
                    </div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile" className="mt-4 md:mt-6">
        <Card className="border-2 border-primary bg-background">
          <CardHeader className="border-b">
            <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest">Metadata Repository</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8 md:gap-12 pt-6 md:pt-8 pb-8 md:pb-12">
            <div className="space-y-6 md:space-y-8">
              <div>
                <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-50">Full Name</Label>
                <p className="text-2xl md:text-3xl font-black uppercase tracking-tighter truncate">{subject.name}</p>
              </div>
              <div>
                <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-50">National Identity Number</Label>
                <p className="text-xl md:text-2xl font-mono font-black">{subject.idNumber}</p>
              </div>
            </div>
            <div className="space-y-6 md:space-y-8">
              <div>
                <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-50">RICA Registered Number</Label>
                <p className="text-xl md:text-2xl font-mono font-black text-primary">{subject.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-50">Identity Verification</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="rounded-none bg-primary text-primary-foreground font-black px-3 md:px-4 text-[9px]">DHA_VERIFIED</Badge>
                  <Badge variant="outline" className="rounded-none font-black border-primary text-[9px]">RICA_ACTIVE</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="location" className="mt-4 md:mt-6">
        <Card className="border-2 border-primary mb-4 md:mb-6">
           <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4 md:gap-6">
               <div className={`p-3 md:p-4 border-2 ${simulating ? 'bg-primary animate-pulse border-primary' : 'border-primary'}`}>
                 <Radio className={simulating ? 'text-white h-5 w-5' : 'text-primary h-5 w-5'} />
               </div>
               <div>
                 <h3 className="font-black text-base md:text-lg uppercase tracking-tighter">GSM Vector Intercept</h3>
                 <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase">NODE: {subject.idNumber}</p>
               </div>
             </div>
             <Button size="lg" onClick={simulatePing} disabled={simulating} className="h-12 md:h-14 w-full md:w-auto px-8 md:px-10 font-black rounded-none uppercase text-xs">
                {simulating ? 'LOCKING...' : 'INITIATE TRIANGULATION'}
             </Button>
           </CardContent>
        </Card>
        <LocationMap locations={locations || []} />
      </TabsContent>

      <TabsContent value="background-check" className="mt-4 md:mt-6">
        <BackgroundCheckForm subject={subject} />
      </TabsContent>

      <TabsContent value="reports" className="mt-4 md:mt-6">
        <ReportsHistory reports={reports || []} isLoading={reportsLoading} />
      </TabsContent>
    </Tabs>
  );
}
