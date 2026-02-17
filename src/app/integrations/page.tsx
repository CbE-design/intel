'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_SOURCES, testIntelligenceConnection, type IntelligenceSource } from '@/lib/intelligence-service';
import { ShieldCheck, Key, Database, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function IntegrationsPage() {
  const [sources, setSources] = useState<IntelligenceSource[]>(MOCK_SOURCES);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async (sourceId: string) => {
    setTesting(sourceId);
    const result = await testIntelligenceConnection(sourceId);
    setTesting(null);
    
    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Connection Verified' : 'Connection Failed',
      description: result.message,
    });
    
    if (result.success) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'Connected', lastSync: new Date() } : s));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Intelligence Gateways" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
        <Alert className="border-primary/50 bg-primary/5 rounded-none">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Production Integration Notice</AlertTitle>
          <AlertDescription className="text-xs opacity-70">
            SAPS and DHA databases are accessed exclusively via authorized gateways (MIE, LexisNexis). 
            Current endpoints are running in <strong>FORENSIC_SIMULATION</strong> mode.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <Card key={source.id} className="border-2 border-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-none border border-primary/20">
                    {source.type === 'Criminal' && <ShieldCheck className="h-5 w-5 text-primary" />}
                    {source.type === 'Credit' && <Database className="h-5 w-5 text-primary" />}
                    {source.type === 'Identity' && <Key className="h-5 w-5 text-primary" />}
                  </div>
                  <Badge variant={source.status === 'Connected' ? 'default' : 'outline'} className="rounded-none font-black text-[9px]">
                    {source.status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-black uppercase mt-4 tracking-tighter">{source.name}</CardTitle>
                <CardDescription className="text-[10px] font-bold opacity-60">{source.provider}</CardDescription>
              </CardHeader>
              <CardContent className="text-[10px] text-muted-foreground font-mono">
                {source.lastSync ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    HEARTBEAT_STABLE: {source.lastSync.toLocaleTimeString()}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    CONFIG_MISMATCH: API_KEY_REQUIRED
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rounded-none font-black uppercase text-[9px] tracking-widest h-8"
                  onClick={() => handleTest(source.id)}
                  disabled={testing === source.id}
                >
                  {testing === source.id ? (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    'Run Connectivity Diagnostic'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-primary rounded-none">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tighter">Architectural Mapping</CardTitle>
            <CardDescription className="text-xs uppercase font-bold opacity-60">Professional Data Orchestration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-none border p-4 bg-muted/30">
              <h3 className="font-black text-[10px] uppercase tracking-widest mb-2">Integration Strategy: SAPS CRC Gateway</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                Veritas Intel uses a decoupled service layer. For production SAPS access, you must obtain an API Key from 
                <strong> MIE (Managed Integrity Evaluation)</strong>. Their API acts as the secure authorized bridge to 
                the SAPS Criminal Record Centre. Once configured, replace the mock tool in 
                <code>src/ai/flows/generate-background-check-report.ts</code> with a direct call to the MIE REST endpoint.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}