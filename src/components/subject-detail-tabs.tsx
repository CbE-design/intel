'use client';

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, FileSearch, MapPin, History, Radio, ShieldAlert, 
  Terminal, Activity, ShieldCheck, Search, Building2,
  Cpu, Layout, Layers, Shield, Fingerprint, Globe
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
import { getCorporateLinkages, getOSINTMatches } from '@/lib/intelligence-service';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { performDeepSearchAction } from '@/lib/actions';

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
  const firestore = useFirestore();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier');
  const [corporateData, setCorporateData] = useState<CorporateLinkage[]>([]);
  const [osintData, setOsintData] = useState<OSINTMatch[]>([]);
  const [loadingIntel, setLoadingIntel] = useState(false);

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
        const [corp, osint] = await Promise.all([
          getCorporateLinkages(subject.idNumber),
          getOSINTMatches(subject.name, subject.idNumber)
        ]);
        setCorporateData(corp);
        setOsintData(osint);
      } catch (e) {
        console.error("Intel fetch failed", e);
      } finally {
        setLoadingIntel(false);
      }
    }
    fetchIntel();
  }, [subject.idNumber, subject.name]);

  useEffect(() => {
    if (deepSearchState.result && firestore) {
      addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'audit_log'), {
        action: `Deep OSINT Cycle Finalized. Findings Analyzed. Risk Score: ${deepSearchState.result.overallRiskScore}`,
        timestamp: serverTimestamp(),
        analyst: 'AI OSINT Module',
        status: 'Success'
      });
      toast({
        title: "OSINT Analysis Archived",
        description: "Verified results from Sherlock and Harvester modules integrated.",
      });
    }
  }, [deepSearchState, firestore, subject.id, toast]);

  const latestReport = reports && reports.length > 0 ? reports[0] : null;
  const latestLocation = locations && locations.length > 0 ? locations[0] : null;

  const chartData = (reports || []).slice().reverse().map(r => ({
    date: r.timestamp instanceof Object && 'seconds' in r.timestamp 
      ? new Date(r.timestamp.seconds * 1000).toLocaleDateString()
      : 'Prev',
    score: r.verificationScore
  }));

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
      <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50 p-1">
        <TabsTrigger value="dossier" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <ShieldAlert className="mr-2 h-4 w-4" /> Dossier
        </TabsTrigger>
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="osint">
          <Globe className="mr-2 h-4 w-4" /> OSINT
        </TabsTrigger>
        <TabsTrigger value="background-check">
          <FileSearch className="mr-2 h-4 w-4" /> investigation
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" /> Intelligence Command Console
                </CardTitle>
                <Badge variant="outline" className="bg-background text-[10px]">REAL-TIME SYNC ACTIVE</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end justify-between border-b border-primary/10 pb-4">
                  <div className="grid gap-1">
                    <span className="text-4xl font-bold tracking-tighter">{latestReport?.verificationScore || '0'}%</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Confidence Aggregate</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-end border-b border-primary/10 pb-4">
                  <Badge variant={subject.status === 'Clear' ? 'default' : 'destructive'} className="text-lg px-6 py-1 uppercase rounded-sm">
                    {subject.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-widest">Target Threat Level</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-[140px] w-full mt-4">
                   <ChartContainer config={{ score: { label: "Score", color: "hsl(var(--primary))" } }}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary)/0.1)" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="stepAfter" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: "hsl(var(--primary))" }} 
                        />
                      </LineChart>
                   </ChartContainer>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-background p-3 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Radio className="h-3 w-3" /> Last Triangulation
                    </p>
                    <p className="text-xs font-mono font-bold">{latestLocation ? `${latestLocation.lat.toFixed(4)}, ${latestLocation.lng.toFixed(4)}` : 'SIGNAL ACQUIRING...'}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Corporate Exposure
                    </p>
                    <p className="text-xs font-bold">{corporateData.length} Identified Entities</p>
                  </div>
              </div>

              {latestReport && (
                <div className="rounded-lg bg-background p-4 border border-primary/20 shadow-inner">
                   <h4 className="text-[10px] font-bold uppercase mb-2 text-primary flex items-center gap-2">
                    <Terminal className="h-3 w-3" /> Executive Intelligence Summary
                   </h4>
                   <p className="text-sm leading-relaxed text-foreground/80 italic font-serif">"{latestReport.report}"</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30 border-primary/10">
            <CardHeader className="pb-2 border-b border-primary/5 mb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3 text-primary animate-pulse" /> Live Operational Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] pr-4">
                <div className="space-y-4">
                  {auditLog?.map((log) => (
                    <div key={log.id} className="border-l-2 border-primary/20 pl-4 py-2 relative hover:bg-primary/5 transition-colors rounded-r-md">
                      <div className="absolute -left-[5px] top-3 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                      <p className="text-[11px] font-bold leading-tight uppercase tracking-tight">{log.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {log.timestamp instanceof Object && 'seconds' in log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'RECENT'}
                        </span>
                        <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/20">{log.analyst}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="location" className="mt-4 space-y-4">
        <Card className="border-primary/30 bg-primary/5 shadow-lg">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-full bg-background border-2 ${simulating ? 'animate-pulse border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'border-primary/20'}`}>
                <Radio className={`h-8 w-8 ${simulating ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">GSM Vectoring Interface</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Active cellular handover monitoring. This module initiates a real-time triangulation request to the national GSM gateway.
                </p>
              </div>
            </div>
            <Button size="lg" onClick={simulatePing} disabled={simulating} className="h-14 px-8 font-bold">
              {simulating ? <><Activity className="mr-2 h-5 w-5 animate-spin" /> ESTABLISHING LOCK...</> : <><Radio className="mr-2 h-5 w-5" /> INITIATE GSM POLL</>}
            </Button>
          </CardContent>
        </Card>
        <LocationMap locations={locations || []} />
      </TabsContent>

      <TabsContent value="osint" className="mt-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Card className="border-primary/20 bg-primary/5 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" /> OSINT Intelligence Agent
                  </CardTitle>
                  <form action={deepSearchAction}>
                    <Button size="sm" disabled={isDeepSearching} variant="default">
                      {isDeepSearching ? <><Activity className="mr-2 h-3 w-3 animate-spin" /> Deep Search Active...</> : <><Shield className="mr-2 h-3 w-3" /> Initiate Full OSINT Cycle</>}
                    </Button>
                  </form>
                </div>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Cross-referencing Sherlock, theHarvester, and DarkWeb datasets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deepSearchState.result && (
                  <div className="bg-black text-green-500 font-mono text-[10px] p-4 rounded border-2 border-primary/20 h-48 overflow-auto mb-4 shadow-inner">
                    <p className="opacity-50"># Initiating Sherlock Username Discovery Module...</p>
                    {deepSearchState.result.sherlockResults.map((res, i) => (
                      <p key={i} className={res.exists ? "text-green-400" : "text-gray-600"}>
                        [{res.exists ? "+" : "-"}] {res.site.padEnd(15)}: {res.exists ? `MATCH FOUND -> ${res.url}` : "NO RECORD"}
                      </p>
                    ))}
                    <p className="opacity-50"># Sherlock module cycle complete.</p>
                  </div>
                )}

                {deepSearchState.result ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-background border border-primary/20 rounded-lg font-serif italic text-sm leading-relaxed shadow-sm">
                      "{deepSearchState.result.summary}"
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase text-primary flex items-center gap-2 tracking-widest">
                          <Terminal className="h-3 w-3" /> Sherlock Username Trace
                        </h4>
                        <div className="grid gap-2">
                          {deepSearchState.result.sherlockResults.slice(0, 5).map((res, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] bg-background p-2 border border-primary/5 rounded shadow-sm">
                              <span className="font-mono font-bold">{res.site}</span>
                              <Badge variant={res.exists ? 'default' : 'secondary'} className="h-4 text-[8px] px-2 rounded-sm">
                                {res.exists ? 'TARGET IDENTIFIED' : 'NO RECORD'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase text-primary flex items-center gap-2 tracking-widest">
                          <Search className="h-3 w-3" /> theHarvester Recon
                        </h4>
                        <div className="grid gap-2">
                          {deepSearchState.result.harvesterResults.map((res, i) => (
                            <div key={i} className="flex flex-col gap-1 bg-background p-2 border border-primary/5 rounded shadow-sm">
                              <div className="flex items-center justify-between text-[9px] border-b border-primary/5 pb-1 mb-1">
                                <span className="font-bold uppercase text-primary">{res.source}</span>
                                <span className="text-muted-foreground font-mono">{res.type}</span>
                              </div>
                              <span className="text-[10px] font-mono truncate font-bold">{res.value}</span>
                              {res.leaked && <Badge className="w-fit text-[7px] h-3 px-1 mt-1 bg-destructive/10 text-destructive border-destructive/20 font-bold">BREACH MATCH</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-primary/10 rounded-lg bg-muted/20">
                    <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">OSINT Engine Standby</p>
                    <p className="text-xs text-muted-foreground max-w-[300px] mt-2 italic font-serif">
                      Execute a full cycle to crawl simulated GitHub OSINT modules and synthesize digital footprint findings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/20 h-fit border-primary/5 shadow-sm">
             <CardHeader className="pb-4">
               <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                 <Globe className="h-3 w-3 text-primary" /> Surface Intelligence
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Verified Directorships</h4>
                  {corporateData.length > 0 ? corporateData.map((corp, i) => (
                    <div key={i} className="p-3 border border-primary/10 rounded-md bg-background text-[11px] shadow-sm">
                      <p className="font-bold uppercase text-primary">{corp.companyName}</p>
                      <p className="text-muted-foreground text-[9px] font-mono">{corp.registrationNumber}</p>
                      <div className="flex justify-between mt-2 font-mono text-[10px]">
                        <span className="font-bold text-foreground">{corp.role}</span>
                        <span className="text-muted-foreground">{corp.appointmentDate}</span>
                      </div>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic p-4 text-center border rounded border-dashed">No CIPC linkages identified.</p>}
                </div>

                <div className="space-y-3 pt-4 border-t border-primary/5">
                   <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Digital Presence Matches</h4>
                   {osintData.map((match, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-background border border-primary/5 rounded text-[10px] shadow-sm">
                        <div className={`h-2 w-2 rounded-full ${match.status === 'Match Found' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <span className="font-bold w-16 uppercase tracking-tighter">{match.platform}</span>
                        <span className="text-muted-foreground truncate italic">{match.details}</span>
                      </div>
                    ))}
                </div>
             </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="profile" className="mt-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Consolidated Subject Identity</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">Verified biographical data from DHA and national registers.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-primary transition-colors">Full Name</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold tracking-tight">{subject.name}</p>
                  <Badge variant="outline" className="text-[9px] bg-green-500/5 text-green-500 border-green-500/20 font-bold">VERIFIED</Badge>
                </div>
              </div>
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-primary transition-colors">National ID Number</p>
                <p className="text-xl font-mono font-bold tracking-widest">{subject.idNumber}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-primary transition-colors">Consolidated Address</p>
                <p className="text-xl font-bold leading-tight">{subject.address}</p>
              </div>
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-primary transition-colors">Primary Communication Link</p>
                <p className="text-xl font-mono font-bold text-primary">{subject.phoneNumber}</p>
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
    </Tabs>
  );
}
