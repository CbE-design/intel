'use client';

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, FileSearch, MapPin, History, Radio, ShieldAlert, 
  Terminal, Activity, ShieldCheck, Search, Building2,
  Cpu, Layers, Shield, Fingerprint, Globe, Mail, Phone,
  CheckCircle2, XCircle, AlertTriangle, Key
} from 'lucide-react';
import { BackgroundCheckForm } from './background-check-form';
import { LocationMap } from './location-map';
import { ReportsHistory } from './reports-history';
import type { Location, Subject, Report, AuditEntry, CorporateLinkage, OSINTMatch } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCorporateLinkages, getOSINTMatches, performRICAReview } from '@/lib/intelligence-service';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { performDeepSearchAction } from '@/lib/actions';
import { format } from 'date-fns';

function sanitizeForServer(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    if (value && typeof value === 'object') {
      if ('seconds' in value && 'nanoseconds' in value) {
        if (typeof value.toDate === 'function') {
          sanitized[key] = value.toDate().toISOString();
        } else {
          sanitized[key] = new Date(value.seconds * 1000).toISOString();
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => sanitizeForServer(item));
      } else {
        sanitized[key] = sanitizeForServer(value);
      }
    }
  }
  return sanitized;
}

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
  }, [subject.idNumber, subject.name, subject.phoneNumber]);

  useEffect(() => {
    if (deepSearchState.result && firestore) {
      addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'audit_log'), {
        action: `Deep Discovery Cycle Finalized. RICA Status: ${deepSearchState.result.ricaResults?.status || 'UNKNOWN'}. Risk Score: ${deepSearchState.result.overallRiskScore}`,
        timestamp: serverTimestamp(),
        analyst: 'AI OSINT Module',
        status: 'Success'
      });
      toast({
        title: "OSINT & RICA Analysis Archived",
        description: "Telephonic identity and digital footprints synthesized.",
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
    
    const newPoint = { 
      lat: newLat, 
      lng: newLng, 
      timestamp: serverTimestamp(), 
      consent: true, 
      deviceId: 'GSM-VECTOR-PRO-01' 
    };

    addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'location_data'), newPoint);
    
    addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'audit_log'), {
      action: `GSM Triangulation Lock: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
      timestamp: serverTimestamp(),
      analyst: 'Automated Investigative Agent',
      status: 'Info'
    });

    setTimeout(() => {
      setSimulating(false);
      toast({
        title: "GSM Lock Established",
        description: `Coordinates intercepted: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
      });
    }, 1500);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6 h-12 bg-black/10 dark:bg-white/5 p-1 rounded-none border-y">
        <TabsTrigger value="dossier" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none uppercase text-[10px] font-bold tracking-widest">
          <ShieldAlert className="mr-2 h-3 w-3" /> Dossier
        </TabsTrigger>
        <TabsTrigger value="profile" className="rounded-none uppercase text-[10px] font-bold tracking-widest">
          <User className="mr-2 h-3 w-3" /> Identity
        </TabsTrigger>
        <TabsTrigger value="osint" className="rounded-none uppercase text-[10px] font-bold tracking-widest">
          <Globe className="mr-2 h-3 w-3" /> OSINT
        </TabsTrigger>
        <TabsTrigger value="background-check" className="rounded-none uppercase text-[10px] font-bold tracking-widest">
          <FileSearch className="mr-2 h-3 w-3" /> Search
        </TabsTrigger>
        <TabsTrigger value="reports" className="rounded-none uppercase text-[10px] font-bold tracking-widest">
          <History className="mr-2 h-3 w-3" /> Archive
        </TabsTrigger>
        <TabsTrigger value="location" className="rounded-none uppercase text-[10px] font-bold tracking-widest">
          <MapPin className="mr-2 h-3 w-3" /> Tracking
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dossier" className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 border-primary bg-background md:col-span-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" /> Forensic Command Console
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-primary font-bold">NODE_ACTIVE</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Confidence Aggregate</span>
                  <span className="text-6xl font-black tracking-tighter">{latestReport?.verificationScore || '0'}<span className="text-2xl">%</span></span>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Target Threat Assessment</span>
                  <div className={`text-2xl font-black px-6 py-2 uppercase border-2 ${subject.status === 'Clear' ? 'border-primary' : 'border-destructive text-destructive'}`}>
                    {subject.status}
                  </div>
                </div>
              </div>

              {mounted && chartData.length > 0 && (
                <div className="h-[120px] w-full border p-4 bg-muted/20">
                   <ChartContainer config={{ score: { label: "Confidence", color: "hsl(var(--primary))" } }}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="hsl(var(--primary)/0.1)" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="stepAfter" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={4} 
                          dot={{ r: 0 }} 
                          activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                        />
                      </LineChart>
                   </ChartContainer>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border bg-muted/5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1 tracking-widest">
                      <Radio className="h-3 w-3" /> Last Intercept
                    </p>
                    <p className="text-sm font-mono font-black">{mounted && latestLocation ? `${latestLocation.lat.toFixed(5)}, ${latestLocation.lng.toFixed(5)}` : 'SIGNAL_ACQUIRING'}</p>
                  </div>
                  <div className="p-4 border bg-muted/5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1 tracking-widest">
                      <Building2 className="h-3 w-3" /> Corporate Linkages
                    </p>
                    <p className="text-sm font-black">{corporateData.length} Entities Identified</p>
                  </div>
              </div>

              {latestReport && (
                <div className="p-6 border-l-[6px] border-primary bg-muted/10">
                   <h4 className="text-[9px] font-bold uppercase mb-3 text-muted-foreground flex items-center gap-2 tracking-[0.3em]">
                    <Terminal className="h-3 w-3" /> Executive Summary Output
                   </h4>
                   <p className="text-sm leading-relaxed text-foreground font-medium italic">"{latestReport.report}"</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-black text-white dark:bg-white dark:text-black shadow-lg">
            <CardHeader className="pb-4 border-b border-white/10 dark:border-black/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-3 w-3 animate-pulse" /> Operational Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {mounted && auditLog?.map((log) => (
                    <div key={log.id} className="border-l border-white/20 dark:border-black/20 pl-4 py-1 relative">
                      <div className="absolute -left-[3px] top-2 h-1.5 w-1.5 bg-white dark:bg-black ring-2 ring-black dark:ring-white" />
                      <p className="text-[10px] font-black uppercase leading-tight tracking-tight mb-1">{log.action}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] opacity-60 font-mono">
                          {log.timestamp instanceof Object && 'seconds' in (log.timestamp as any) ? format(new Date((log.timestamp as any).seconds * 1000), 'HH:mm:ss') : 'RECENT'}
                        </span>
                        <Badge variant="outline" className="text-[7px] h-3 px-1 border-white/20 dark:border-black/20 uppercase text-white dark:text-black">{log.analyst}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="location" className="mt-6 space-y-6">
        <Card className="border-2 border-primary bg-background">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className={`p-6 border-2 ${simulating ? 'bg-primary text-primary-foreground animate-pulse' : 'border-primary bg-muted/10'}`}>
                <Radio className={`h-10 w-10`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-xl uppercase tracking-tighter">GSM Vectoring Interface</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Encrypted Handover Poll - Target UID: {subject.idNumber}
                </p>
              </div>
            </div>
            <Button size="lg" onClick={simulatePing} disabled={simulating} className="h-16 px-12 font-black text-sm uppercase tracking-widest rounded-none">
              {simulating ? <><Activity className="mr-3 h-5 w-5 animate-spin" /> ACQUIRING_FIX</> : <><Radio className="mr-3 h-5 w-5" /> INITIATE POLL</>}
            </Button>
          </CardContent>
        </Card>
        <LocationMap locations={locations || []} />
      </TabsContent>

      <TabsContent value="osint" className="mt-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-2 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" /> GitHub Intelligence Modules
                  </CardTitle>
                  <form action={deepSearchAction}>
                    <Button size="sm" disabled={isDeepSearching} className="rounded-none uppercase text-[10px] font-black h-8 px-4">
                      {isDeepSearching ? <><Activity className="mr-2 h-3 w-3 animate-spin" /> RUNNING_CRAWL</> : <><Shield className="mr-2 h-3 w-3" /> DEEP DISCOVERY</>}
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {mounted && deepSearchState.result && (
                  <div className="bg-black text-white font-mono text-[9px] p-6 mb-6 overflow-auto h-64 border-l-[10px] border-primary">
                    <p className="opacity-40 mb-2"># VERITAS INTEL TERMINAL V4.0 // AGENT_ID: OSINT_PRO</p>
                    <p className="text-primary font-bold"># RUNNING PHONEINFOGA (GSM RECON)...</p>
                    <p>[MATCH] Carrier: {deepSearchState.result.phoneResults.carrier}</p>
                    <p>[MATCH] Location: {deepSearchState.result.phoneResults.location}</p>
                    <p className="text-primary font-bold mt-2"># RUNNING HOLEHE (EMAIL TRACE)...</p>
                    {deepSearchState.result.holeheResults?.map((res: any, i: number) => (
                      <p key={`holehe-${i}`}>[{res.exists ? "MATCH" : "EMPTY"}] {res.site.toUpperCase().padEnd(15)}</p>
                    ))}
                    <p className="text-primary font-bold mt-2"># RUNNING SHERLOCK (USERNAME CRAWL)...</p>
                    {deepSearchState.result.sherlockResults.slice(0, 10).map((res: any, i: number) => (
                      <p key={`sherlock-${i}`} className={res.exists ? "font-bold" : "opacity-30"}>
                        [{res.exists ? "MATCH" : "EMPTY"}] {res.site.toUpperCase().padEnd(15)} :: {res.exists ? res.url : "NOT_FOUND"}
                      </p>
                    ))}
                    <p className="opacity-40 mt-2"># DISCOVERY CYCLE COMPLETE.</p>
                  </div>
                )}

                {mounted && deepSearchState.result ? (
                  <div className="space-y-8">
                    <div className="p-6 bg-muted/20 border-l-[6px] border-primary font-medium text-sm leading-relaxed italic">
                      "{deepSearchState.result.summary}"
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-[0.2em] mb-4">
                            <Phone className="h-3 w-3" /> PhoneInfoga Fixed
                          </h4>
                          <div className="p-4 border bg-muted/5 space-y-2 text-[10px]">
                            <div className="flex justify-between"><span>Carrier</span><span className="font-black">{deepSearchState.result.phoneResults.carrier}</span></div>
                            <div className="flex justify-between"><span>Location</span><span className="font-black">{deepSearchState.result.phoneResults.location}</span></div>
                            <div className="flex justify-between"><span>Type</span><span className="font-black">{deepSearchState.result.phoneResults.type}</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-[0.2em] mb-4">
                            <Mail className="h-3 w-3" /> Holehe Trace
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                             {deepSearchState.result.holeheResults?.map((res: any, i: number) => (
                                <div key={i} className={`p-2 border text-[9px] font-black flex justify-between items-center ${res.exists ? 'bg-primary text-primary-foreground' : 'opacity-40'}`}>
                                  {res.site}
                                  {res.exists && <ShieldCheck className="h-2 w-2" />}
                                </div>
                             ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-[0.2em]">
                          <Terminal className="h-3 w-3" /> Sherlock Matches
                        </h4>
                        <div className="grid gap-2">
                          {deepSearchState.result.sherlockResults.filter((r: any) => r.exists).map((res: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b bg-muted/5">
                              <span className="text-[10px] font-black uppercase tracking-widest">{res.site}</span>
                              <Badge variant="default" className="text-[8px] rounded-none">TARGET_LOCK</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed bg-muted/5">
                    <Layers className="h-16 w-16 text-muted-foreground mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] mb-2">Engine Standby</p>
                    <p className="text-[10px] text-muted-foreground max-w-[280px] uppercase font-bold tracking-widest leading-loose">
                      Initiate deep discovery to crawl Sherlock, theHarvester, PhoneInfoga, and Holehe modules.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/10 h-fit border border-primary">
             <CardHeader className="pb-4 border-b">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Building2 className="h-3 w-3" /> Registry Intel
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">CIPC Directorships</h4>
                  {corporateData.length > 0 ? corporateData.map((corp, i) => (
                    <div key={i} className="p-4 border bg-background space-y-2">
                      <p className="font-black text-[11px] uppercase tracking-tighter">{corp.companyName}</p>
                      <p className="text-[9px] font-mono opacity-60">{corp.registrationNumber}</p>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-[9px] font-black uppercase tracking-widest">{corp.role}</span>
                        <span className="text-[9px] font-mono opacity-60">{corp.appointmentDate}</span>
                      </div>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic p-6 text-center border border-dashed">No CIPC records found.</p>}
                </div>

                <div className="space-y-4 pt-6 border-t">
                   <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Identity Matches</h4>
                   {osintData.map((match, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-background border text-[10px]">
                        <div className={`h-2 w-2 rounded-full ${match.status === 'Match Found' ? 'bg-primary' : 'bg-muted'}`} />
                        <span className="font-black w-20 uppercase tracking-tighter">{match.platform}</span>
                        <span className="text-muted-foreground truncate italic opacity-60">{match.details}</span>
                      </div>
                    ))}
                </div>
             </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="profile" className="mt-6 space-y-6">
        <Card className="border-2 border-primary bg-background shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Verified Subject Metadata</CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Intelligence Snapshot // ID: {subject.idNumber}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-12 pt-8">
            <div className="space-y-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Full Name</p>
                <div className="flex items-baseline gap-4">
                  <p className="text-3xl font-black tracking-tighter">{subject.name.toUpperCase()}</p>
                  <Badge className="text-[8px] bg-black text-white dark:bg-white dark:text-black rounded-none px-2 font-black">VERIFIED</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">National ID Identity</p>
                <p className="text-2xl font-mono font-black tracking-[0.2em]">{subject.idNumber}</p>
              </div>
            </div>
            <div className="space-y-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered Domicile</p>
                <p className="text-2xl font-black tracking-tighter leading-none">{subject.address.toUpperCase()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Communication Link</p>
                <p className="text-2xl font-mono font-black text-primary tracking-tighter">{subject.phoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {ricaData && (
          <Card className="border-2 border-primary bg-background overflow-hidden">
             <CardHeader className="bg-muted/30 pb-4 border-b">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-primary" /> RICA Compliance Dossier
                   </CardTitle>
                   <CardDescription className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">RSA REGULATORY FRAMEWORK - ACT NO. 70 OF 2002</CardDescription>
                 </div>
                 <Badge variant={ricaData.status === 'Verified' ? 'default' : 'destructive'} className="rounded-none uppercase text-[9px] font-black px-4">
                   {ricaData.status}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Registered Holder</span>
                         <p className="text-sm font-black uppercase tracking-tight">{ricaData.registeredName}</p>
                       </div>
                       <div className="space-y-1">
                         <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">ID Reference</span>
                         <p className="text-sm font-mono font-black">{ricaData.registeredId}</p>
                       </div>
                    </div>
                    <div className="p-4 bg-muted/10 border-l-4 border-primary">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-widest">Registration Locality</p>
                       <p className="text-xs font-medium italic">"{ricaData.registeredAddress}"</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center border-l pl-6 space-y-4">
                    <div className="space-y-1">
                       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Activation Link</span>
                       <div className="flex items-center gap-2 text-[10px] font-black">
                         <Activity className="h-3 w-3 text-primary" /> {ricaData.provider}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Last Verified</span>
                       <div className="flex items-center gap-2 text-[10px] font-black">
                         <History className="h-3 w-3 text-primary" /> {ricaData.ricaDate}
                       </div>
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="background-check" className="mt-6">
        <BackgroundCheckForm subject={subject} />
      </TabsContent>

      <TabsContent value="reports" className="mt-6">
        <ReportsHistory reports={reports || []} isLoading={reportsLoading} />
      </TabsContent>
    </Tabs>
  );
}
