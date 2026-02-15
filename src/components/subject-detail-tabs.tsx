'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, FileSearch, MapPin, History, Radio, ShieldAlert, CheckCircle2, 
  AlertCircle, Terminal, Activity, ShieldCheck, Wifi, ExternalLink, 
  Building2, Search, Briefcase, BarChart3 
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

export function SubjectDetailTabs({ subject }: { subject: Subject }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier');
  const [corporateData, setCorporateData] = useState<CorporateLinkage[]>([]);
  const [osintData, setOsintData] = useState<OSINTMatch[]>([]);
  const [loadingIntel, setLoadingIntel] = useState(false);

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

  const latestReport = reports && reports.length > 0 ? reports[0] : null;
  const latestLocation = locations && locations.length > 0 ? locations[0] : null;

  // Chart data for risk trend
  const chartData = (reports || []).slice().reverse().map(r => ({
    date: r.timestamp instanceof Object && 'seconds' in r.timestamp 
      ? new Date(r.timestamp.seconds * 1000).toLocaleDateString()
      : 'Previous',
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
        <TabsTrigger value="osint"><Search className="mr-2 h-4 w-4" /> OSINT</TabsTrigger>
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
                <BarChart3 className="h-4 w-4 text-primary" />
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

              {chartData.length > 1 && (
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
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Audit Depth</span>
                  <span>{reports?.length || 0} Investigative Cycles Completed</span>
                </div>
                <Progress value={(reports?.length || 0) * 20} className="h-1.5" />
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
              <ScrollArea className="h-[280px] pr-4">
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
              <div className="pt-4 border-t">
                 <h4 className="text-[10px] font-bold uppercase mb-4 text-muted-foreground">External OSINT Links</h4>
                 <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 text-[10px]">
                      <a href={`https://www.google.com/search?q="${subject.name}"`} target="_blank"><ExternalLink className="mr-2 h-3 w-3" /> Google Search</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-8 text-[10px]">
                      <a href={`https://www.linkedin.com/search/results/all/?keywords=${subject.name}`} target="_blank"><Briefcase className="mr-2 h-3 w-3" /> LinkedIn Search</a>
                    </Button>
                 </div>
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

      <TabsContent value="osint" className="mt-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> CIPC Corporate Linkages
              </CardTitle>
              <CardDescription>Directorships and shareholding identified via company registry.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingIntel ? (
                <div className="flex items-center justify-center py-10"><Activity className="animate-spin text-primary" /></div>
              ) : corporateData.length > 0 ? (
                <div className="space-y-4">
                  {corporateData.map((corp, i) => (
                    <div key={i} className="rounded-lg border p-3 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm uppercase">{corp.companyName}</h4>
                        <Badge variant="outline" className="text-[9px]">{corp.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Reg: {corp.registrationNumber}</p>
                      <div className="flex justify-between items-center mt-2 text-[10px]">
                        <span className="font-bold text-primary">{corp.role}</span>
                        <span className="text-muted-foreground italic">Appointed: {corp.appointmentDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground">No active corporate directorships identified.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Digital Footprint Analysis
              </CardTitle>
              <CardDescription>Synthesized search results from public digital archives.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingIntel ? (
                <div className="flex items-center justify-center py-10"><Activity className="animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  {osintData.map((match, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/10 transition-colors">
                      <div className={`p-1.5 rounded-full ${match.status === 'Match Found' ? 'bg-primary/10' : 'bg-muted'}`}>
                        {match.status === 'Match Found' ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="grid gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{match.platform}</span>
                          <span className={`text-[8px] font-bold px-1.5 rounded ${match.status === 'Match Found' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>{match.status}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{match.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
