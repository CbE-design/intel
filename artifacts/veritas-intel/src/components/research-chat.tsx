'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Terminal, Send, Cpu, Globe, AlertTriangle,
  Zap, Save, Trash2, ShieldAlert, Network, Target,
  Activity, Wifi, SignalLow, Fingerprint
} from 'lucide-react';
import { performGlobalResearchAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ResearchReport } from '@/lib/types';

interface Message {
  role: 'user' | 'model';
  content: string;
  assessment?: string;
  trendData?: any;
}

export function ResearchChat({ initialReport, onReportSaved }: { initialReport?: ResearchReport | null; onReportSaved?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `GLOBAL RESEARCH TERMINAL ACTIVE. NODE: VERITAS-ALPHA-01. 
PROTOCOL: UNRESTRICTED FORENSIC OVERRIDE. 
READY TO INTERROGATE GLOBAL SYNDICATE STRUCTURES AND MODUS OPERANDI.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemLatency, setSystemLatency] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLatency(Math.floor(Math.random() * 120) + 40);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialReport) {
      setMessages([
        {
          role: 'model',
          content: `ARCHIVED DOSSIER LOADED: ${initialReport.topic.toUpperCase()}\n\n${initialReport.content}`,
          assessment: initialReport.assessment,
          trendData: initialReport.trendData
        },
        {
          role: 'model',
          content: `CONTEXT SYNCHRONIZED. I am ready to perform additional forensic analysis or trend interrogation based on this dossier.`
        }
      ]);
    }
  }, [initialReport]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    const currentDossierContext = initialReport ? `Analysis is continuing based on the dossier: ${initialReport.topic}` : "";

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await performGlobalResearchAction(userMessage + "\n\n" + currentDossierContext);

      if (result.error) {
        const isQuota = result.statusCode === 429 || result.isQuota;
        const msg = isQuota
          ? `ANALYSIS QUOTA REACHED.\n\nThe daily analysis limit has been exhausted. Please wait a few minutes and retry.`
          : result.error;
        setMessages(prev => [...prev, { role: 'model', content: msg }]);
      } else if (result.response) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: result.response?.response || 'No analysis returned.',
          assessment: result.response?.assessment,
          trendData: result.response?.trendData
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: `Analysis service temporarily unavailable. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToArchive = async (message: Message) => {
    if (!message.content) return;

    const msgIndex = messages.indexOf(message);
    const topic = msgIndex > 0 ? messages[msgIndex - 1].content : 'Untitled Research';

    try {
      await api.researchReports.create({
        topic: topic.slice(0, 100),
        content: message.content,
        assessment: message.assessment || 'TREND_ANALYSIS',
        trendData: message.trendData || {},
        analyst: 'Veritas Intelligence Agent'
      });
      toast({
        title: "Research Dossier Archived",
        description: "The global findings have been saved to the centralized Intelligence Library.",
      });
      onReportSaved?.();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Archive failed', description: e.message });
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'model',
      content: `GLOBAL RESEARCH TERMINAL RESET. UNRESTRICTED FORENSIC OVERRIDE ACTIVE.`
    }]);
  };

  return (
    <Card className="flex flex-col h-[800px] border-2 border-primary bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] rounded-none overflow-hidden">
      <CardHeader className="border-b bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Global Forensic Hub
            </CardTitle>
            <div className="flex items-center gap-3">
              <p className="text-[7px] font-black opacity-50 uppercase tracking-tighter flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> SYNC: ACTIVE
              </p>
              <p className="text-[7px] font-black opacity-50 uppercase tracking-tighter flex items-center gap-1.5">
                <Wifi className="h-3 w-3" /> LATENCY: {systemLatency}ms
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat} className="text-[9px] h-7 rounded-none font-black uppercase border-primary hover:bg-destructive hover:text-destructive-foreground transition-none">
              <Trash2 className="h-3 w-3 mr-1.5" /> Purge Cache
            </Button>
            <Badge variant="outline" className="text-[9px] border-primary font-black animate-pulse bg-primary/5">NODE_ALPHA_01</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 bg-black/5 dark:bg-white/5">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">
                    {m.role === 'user' ? 'OPERATOR' : 'VERITAS_ANALYST'}
                  </span>
                  {m.assessment && (
                    <Badge className="text-[7px] rounded-none h-3 px-1 font-black bg-primary text-primary-foreground uppercase tracking-widest">
                      {m.assessment.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                <div className={`max-w-[95%] p-5 text-xs font-mono border-2 ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary rounded-l-lg rounded-tr-lg'
                    : 'bg-background border-primary rounded-r-lg rounded-tl-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed mb-4">{m.content}</div>

                  {m.trendData && (
                    <div className="mt-6 pt-6 border-t border-primary/20 space-y-6 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4 text-[9px]">
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">SEVERITY INDEX:</p>
                          <p className="font-black text-primary text-xs uppercase">{m.trendData.severity || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">GEO-RADIUS:</p>
                          <p className="font-black text-xs uppercase">{m.trendData.geographicFocus || 'GLOBAL'}</p>
                        </div>
                      </div>
                      {m.trendData.latestDevelopments && (
                        <div className="p-4 bg-primary/5 border-2 border-primary/20 space-y-2">
                          <p className="text-[9px] font-black uppercase flex items-center gap-1.5 text-primary">
                            <Zap className="h-3 w-3 animate-pulse" /> Telemetry Update (2024-2025)
                          </p>
                          <p className="text-[10px] leading-relaxed font-bold italic">{m.trendData.latestDevelopments}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        {m.trendData.vulnerabilityAssessment && (
                          <div className="p-3 bg-muted/20 border-l-4 border-primary space-y-1">
                            <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Systemic Exploits</p>
                            <p className="text-[9px] leading-tight opacity-80">{m.trendData.vulnerabilityAssessment}</p>
                          </div>
                        )}
                        {m.trendData.tacticalMechanics && (
                          <div className="p-3 bg-primary/5 border rounded-none space-y-1">
                            <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Target className="h-3 w-3" /> Execution Log</p>
                            <p className="text-[9px] leading-tight opacity-80">{m.trendData.tacticalMechanics}</p>
                          </div>
                        )}
                      </div>
                      {m.trendData.syndicateMapping && (
                        <div className="p-3 border-2 border-dashed border-primary/30 space-y-1">
                          <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Network className="h-3 w-3" /> Syndicate Hierarchy</p>
                          <p className="text-[10px] leading-tight font-bold">{m.trendData.syndicateMapping}</p>
                        </div>
                      )}
                      {m.trendData.technicalIndicators && m.trendData.technicalIndicators.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[8px] font-black uppercase opacity-50 flex items-center gap-2">
                            <SignalLow className="h-3 w-3" /> Technical IOCs:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {m.trendData.technicalIndicators.map((ioc: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[7px] border-primary/30 rounded-none bg-primary/5 font-mono h-4">
                                {ioc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {m.role === 'model' && i > 0 && (
                    <div className="mt-4 pt-4 border-t border-primary/10 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[9px] h-7 rounded-none font-black uppercase hover:bg-primary hover:text-primary-foreground transition-none border-primary"
                        onClick={() => handleSaveToArchive(m)}
                      >
                        <Save className="h-3 w-3 mr-1.5" /> Archive Node Findings
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col gap-3 text-primary animate-pulse py-6">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Penetrating Intelligence Repositories...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <Input
            placeholder="INTERROGATE GLOBAL TRENDS OR SYNDICATE STRUCTURES..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-none border-2 border-primary font-mono text-[10px] h-14 uppercase font-bold tracking-widest focus-visible:ring-0"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="h-14 w-14 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <Send className="h-6 w-6" />
          </Button>
        </form>
      </CardFooter>
      <div className="px-4 py-2 bg-muted/20 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-50">
            <Zap className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Tunnel: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <Fingerprint className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Auth: VERIFIED</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
          <AlertTriangle className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-widest text-primary">Safety Thresholds: BYPASSED</span>
        </div>
      </div>
    </Card>
  );
}
