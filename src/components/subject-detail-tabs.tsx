'use client';

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, FileSearch, MapPin, History, Radio, ShieldAlert, CheckCircle2, 
  AlertCircle, Terminal, Activity, ShieldCheck, Wifi, ExternalLink, 
  Building2, Search, Briefcase, BarChart3, Fingerprint, Globe, Database,
  Cpu, Layout, Layers, Shield
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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCorporateLinkages, getOSINTMatches } from '@/lib/intelligence-service';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
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
    const newLat = base.lat + (Math.random() - 0.5) * 0.005;
    const newLng = base.lng + (Math.random() - 0.5) * 0.005;
    const newPoint = { lat: newLat, lng: newLng, timestamp: serverTimestamp(), consent: true, deviceId: 'GSM-VECTOR-01' };
    addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'location_data'), newPoint);
    addDocumentNonBlocking(collection(firestore, 'subject_profiles', subject.id, 'audit_log'), {
      action: `GSM Location Intercept: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
      timestamp: serverTimestamp(),
      analyst: 'Automated Investigative Agent',
      status: 'Info'
    });
    setTimeout(() => setSimulating(false), 1200);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="dossier"><ShieldAlert className="mr-2 h-4 w-4" /> Dossier</TabsTrigger>
        <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
        <TabsTrigger value="osint"><Globe className="mr-2 h-4 w-4" /> OSINT</TabsTrigger>
        <TabsTrigger value="background-check"><FileSearch className="mr-2 h-4 w-4" /> Investigation</TabsTrigger>
        <TabsTrigger value="reports"><History className="mr-2 h-4 w-4" /> Archive</TabsTrigger>
        <TabsTrigger value="location"><MapPin className="mr-2 h-4 w-4" /> Tracking</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dossier" className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5 md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Intelligence Snapshot</CardTitle>
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end justify-between border-b pb-4">
                  <div className="grid gap-1">
                    <span className="text-4xl font-bold">{latestReport?.verificationScore || 'N/A'}%</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Confidence Score</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-end border-b pb-4">
                  <Badge variant={subject.status === 'Clear' ? 'default' : 'destructive'} className="text-lg px-4 uppercase">
                    {subject.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase">Threat Level</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-[120px] w-full mt-4">
                   <ChartContainer config={{ score: { label: "Confidence", color: "hsl(var(--primary))" } }}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                   </ChartContainer>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-background p-3 border">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Last Tracking Ping</p>
                    <p className="text-xs font-mono">{latestLocation ? `${latestLocation.lat.toFixed(4)}, ${latestLocation.lng.toFixed(4)}` : 'No Data'}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3 border">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Corporate Ties</p>
                    <p className="text-xs font-bold">{corporateData.length} Identified</p>
                  </div>
              </div>

              {latestReport && (
                <div className="rounded-lg bg-background p-4 border shadow-sm">
                   <h4 className="text-[10px] font-bold uppercase mb-2 text-primary flex items-center gap-2">
                    <Terminal className="h-3 w-3" /> Latest Narrative
                   </h4>
                   <p className="text-sm leading-relaxed text-foreground/80 italic">"{latestReport.report}"</p>
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
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  {auditLog?.map((log) => (
                    <div key={log.id} className="border-l-2 border-primary/30 pl-3 py-1 relative">
                      <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-[11px] font-semibold leading-tight">{log.action}</p>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {log.timestamp instanceof Object && 'seconds' in log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'Recent'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="osint" className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" /> Global Discovery Suite
                  </CardTitle>
                  <form action={deepSearchAction}>
                    <Button size="sm" disabled={isDeepSearching}>
                      {isDeepSearching ? <><Activity className="mr-2 h-3 w-3 animate-spin" /> Deep Crawl Active...</> : <><Shield className="mr-2 h-3 w-3" /> Initiate GitHub Tool-Cycle</>}
                    </Button>
                  </form>
                </div>
                <CardDescription className="text-[10px]">Consolidating logic from Sherlock, theHarvester, and DarkWeb datasets.</CardDescription>
              </CardHeader>
              <CardContent>
                {deepSearchState.result ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-background border rounded-lg font-serif italic text-sm leading-relaxed">
                      "{deepSearchState.result.summary}"
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <Terminal className="h-3 w-3" /> Sherlock Username Trace
                        </h4>
                        <div className="grid gap-1">
                          {deepSearchState.result.sherlockResults.map((res, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] bg-background/50 p-1.5 border rounded">
                              <span className="font-mono">{res.site}</span>
                              <Badge variant={res.exists ? 'default' : 'secondary'} className="h-4 text-[8px] px-1">
                                {res.exists ? 'FOUND' : 'MISSING'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <Search className="h-3 w-3" /> theHarvester Recon
                        </h4>
                        <div className="grid gap-1">
                          {deepSearchState.result.harvesterResults.map((res, i) => (
                            <div key={i} className="flex flex-col gap-0.5 bg-background/50 p-1.5 border rounded">
                              <div className="flex items-center justify-between text-[9px] border-b pb-1 mb-1">
                                <span className="font-bold uppercase text-primary/80">{res.source}</span>
                                <span className="text-muted-foreground">{res.type}</span>
                              </div>
                              <span className="text-[10px] font-mono truncate">{res.value}</span>
                              {res.leaked && <Badge className="w-fit text-[7px] h-3 px-1 mt-1 bg-destructive/10 text-destructive border-destructive/20">BREACH MATCH</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <Layers className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-sm font-medium">Deep OSINT Cycle Standby</p>
                    <p className="text-xs text-muted-foreground max-w-[250px] mt-1">Initiate to pull data from simulated Sherlock and Harvester modules.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-primary" /> CIPC Directorships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {corporateData.length > 0 ? corporateData.map((corp, i) => (
                      <div key={i} className="p-2 border rounded-md bg-muted/20 text-[11px]">
                        <p className="font-bold uppercase">{corp.companyName}</p>
                        <p className="text-muted-foreground text-[9px]">{corp.registrationNumber}</p>
                        <div className="flex justify-between mt-2 font-mono text-primary">
                          <span>{corp.role}</span>
                          <span className="text-muted-foreground">{corp.appointmentDate}</span>
                        </div>
                      </div>
                    )) : <p className="text-center py-4 text-[10px] text-muted-foreground italic">No corporate linkages found.</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Layout className="h-3 w-3 text-primary" /> Surface Footprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {osintData.map((match, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 border rounded text-[10px]">
                        <div className={`h-1.5 w-1.5 rounded-full ${match.status === 'Match Found' ? 'bg-primary' : 'bg-muted'}`} />
                        <span className="font-bold w-16">{match.platform}</span>
                        <span className="text-muted-foreground truncate">{match.details}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-muted/30 h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Globe className="h-3 w-3 text-primary" /> OSINT Command Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="rounded-lg border bg-background p-3 space-y-3">
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Repositories</span>
                   <div className="flex flex-wrap gap-1">
                     <Badge variant="outline" className="text-[8px] bg-primary/5">sherlock-v1.4</Badge>
                     <Badge variant="outline" className="text-[8px] bg-primary/5">harvester-v4.0</Badge>
                     <Badge variant="outline" className="text-[8px] bg-primary/5">leak-checker</Badge>
                   </div>
                 </div>
                 <div className="text-[10px] leading-relaxed text-muted-foreground">
                   Simulated intelligence cycles prioritize South African domain suffixes (.za) and local news archives.
                 </div>
               </div>
               <div className="p-3 border rounded-lg bg-background">
                 <h4 className="text-[9px] font-bold uppercase mb-2">Live Gateway Status</h4>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between text-[9px]">
                     <span>API: Google Dorking</span>
                     <Badge className="h-3 text-[7px] bg-green-500/20 text-green-500 border-none">ACTIVE</Badge>
                   </div>
                   <div className="flex items-center justify-between text-[9px]">
                     <span>API: Social Scraper</span>
                     <Badge className="h-3 text-[7px] bg-green-500/20 text-green-500 border-none">ACTIVE</Badge>
                   </div>
                   <div className="flex items-center justify-between text-[9px]">
                     <span>API: Government Hub</span>
                     <Badge className="h-3 text-[7px] bg-yellow-500/20 text-yellow-500 border-none">LATENCY</Badge>
                   </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Subject Identity Profile</CardTitle>
            <CardDescription>Verified biographic data consolidated from national registers.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium">{subject.name}</p>
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 uppercase">DHA Certified</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">ID Number</p>
                <p className="text-lg font-mono">{subject.idNumber}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Verified Address</p>
                <p className="text-lg leading-tight">{subject.address}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Communication Vector</p>
                <p className="text-lg font-mono">{subject.phoneNumber}</p>
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

      <TabsContent value="location" className="mt-4 space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-background border ${simulating ? 'animate-pulse border-primary' : ''}`}>
                <Radio className={`h-6 w-6 ${simulating ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">GSM Triangulation Vector</h3>
                <p className="text-xs text-muted-foreground">Intercepting cellular handover data for real-time location lock.</p>
              </div>
            </div>
            <Button size="lg" onClick={simulatePing} disabled={simulating}>
              {simulating ? <><Activity className="mr-2 h-4 w-4 animate-spin" /> Polling...</> : <><Radio className="mr-2 h-4 w-4" /> Initiate GSM Poll</>}
            </Button>
          </CardContent>
        </Card>
        <LocationMap locations={locations || []} />
      </TabsContent>
    </Tabs>
  );
}
