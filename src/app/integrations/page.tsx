'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_SOURCES, testIntelligenceConnection, type IntelligenceSource } from '@/lib/intelligence-service';
import { ShieldCheck, Key, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      <PageHeader title="Intelligence Sources" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sources.map((source) => (
            <Card key={source.id} className={source.status === 'Connected' ? 'border-primary/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-lg">
                    {source.type === 'Criminal' && <ShieldCheck className="h-5 w-5 text-primary" />}
                    {source.type === 'Credit' && <Database className="h-5 w-5 text-primary" />}
                    {source.type === 'Identity' && <Key className="h-5 w-5 text-primary" />}
                  </div>
                  <Badge variant={source.status === 'Connected' ? 'default' : 'outline'}>
                    {source.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4">{source.name}</CardTitle>
                <CardDescription>{source.provider}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {source.lastSync ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Last heartbeat: {source.lastSync.toLocaleTimeString()}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Configuration required
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleTest(source.id)}
                  disabled={testing === source.id}
                >
                  {testing === source.id ? (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Architecture Mapping</CardTitle>
            <CardDescription>How Veritas Intel synthesizes external data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2">Integration Strategy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Veritas Intel uses a decoupled service layer. The GenAI flows call standardized 
                tools which interface with the Intelligence Service. This allows you to test 
                investigative workflows using mock data today, and simply replace the service 
                methods with actual REST calls once you have your provider API keys.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
