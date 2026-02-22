'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Cpu, Globe, Search, AlertTriangle, Zap, Save, FileText, Trash2, LayoutPanelLeft, ShieldAlert, Network, Target, Map, Info, Activity } from 'lucide-react';
import { performGlobalResearchAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import type { ResearchReport } from '@/lib/types';

interface Message {
  role: 'user' | 'model';
  content: string;
  assessment?: string;
  trendData?: any;
}

export function ResearchChat({ initialReport }: { initialReport?: ResearchReport | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: `GLOBAL RESEARCH TERMINAL ACTIVE. NODE: VERITAS-ALPHA-01. 
PROTOCOL: UNRESTRICTED FORENSIC OVERRIDE. 
DIRECTIVE: EXHAUSTIVE GLOBAL TREND ANALYSIS. 
READY TO INTERROGATE GLOBAL SYNDICATE STRUCTURES AND MODUS OPERANDI (2023-2025).` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (initialReport) {
      setMessages([
        { 
          role: 'model', 
          content: `ARCHIVED DOSSIER LOADED: ${initialReport.topic.toUpperCase()}\n\n${initialReport.content}`,
          assessment: initialReport.assessment,
          trendData: initialReport.trendData
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
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const result = await performGlobalResearchAction(userMessage);

    if (result.error) {
      setMessages(prev => [...prev, { role: 'model', content: `CRITICAL SYSTEM ERROR: ${result.error}` }]);
    } else if (result.response) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: result.response?.response || 'No analysis returned.',
        assessment: result.response?.assessment,
        trendData: result.response?.trendData
      }]);
    }
    
    setIsLoading(false);
  };

  const handleSaveToArchive = (message: Message) => {
    if (!firestore || !message.content) return;

    // Try to find a topic from the preceding user message
    const msgIndex = messages.indexOf(message);
    const topic = msgIndex > 0 ? messages[msgIndex - 1].content : 'Untitled Research';

    const reportData = {
      topic: topic.slice(0, 100),
      content: message.content,
      assessment: message.assessment || 'TREND_ANALYSIS',
      trendData: message.trendData || {},
      timestamp: serverTimestamp(),
      analyst: 'Veritas Intelligence Agent'
    };

    addDocumentNonBlocking(collection(firestore, 'research_reports'), reportData);

    toast({
      title: "Research Dossier Archived",
      description: "The global findings have been saved to the centralized Intelligence Library.",
    });
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'model', 
      content: `GLOBAL RESEARCH TERMINAL RESET. UNRESTRICTED FORENSIC OVERRIDE ACTIVE.` 
    }]);
  };

  return (
    <Card className="flex flex-col h-[800px] border-2 border-primary bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] rounded-none">
      <CardHeader className="border-b bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Global Forensic Intelligence Hub
            </CardTitle>
            <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter flex items-center gap-2">
              <Activity className="h-3 w-3" /> LIVE INTELLIGENCE SYNTHESIS // SYNC: 2023-2025 TRENDS
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat} className="text-[9px] h-7 rounded-none font-black uppercase border-primary">
              <Trash2 className="h-3 w-3 mr-1.5" /> Reset Node
            </Button>
            <Badge variant="outline" className="text-[9px] border-primary font-black animate-pulse">OVERRIDE_ACTIVE</Badge>
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
                    {m.role === 'user' ? 'OPERATOR' : 'FORENSIC_ANALYST'}
                  </span>
                  {m.assessment && (
                    <Badge className="text-[7px] rounded-none h-3 px-1 font-black bg-primary text-primary-foreground">
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
                    <div className="mt-6 pt-6 border-t border-primary/20 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-[9px]">
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">SEVERITY INDEX:</p>
                          <p className="font-black text-primary text-xs uppercase">{m.trendData.severity || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">GEOGRAPHIC FOCUS:</p>
                          <p className="font-black text-xs uppercase">{m.trendData.geographicFocus || 'GLOBAL'}</p>
                        </div>
                      </div>

                      {m.trendData.latestDevelopments && (
                        <div className="p-4 bg-primary/5 border-2 border-primary/20 space-y-2">
                           <p className="text-[9px] font-black uppercase flex items-center gap-1.5 text-primary">
                             <Zap className="h-3 w-3 animate-pulse" /> Latest Developments (2024-2025)
                           </p>
                           <p className="text-[10px] leading-relaxed font-bold italic">{m.trendData.latestDevelopments}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {m.trendData.vulnerabilityAssessment && (
                          <div className="p-3 bg-muted/20 border-l-4 border-primary space-y-1">
                             <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Systemic Vulnerabilities</p>
                             <p className="text-[9px] leading-tight opacity-80">{m.trendData.vulnerabilityAssessment}</p>
                          </div>
                        )}

                        {m.trendData.tacticalMechanics && (
                          <div className="p-3 bg-primary/5 border rounded-none space-y-1">
                             <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Target className="h-3 w-3" /> Tactical Execution</p>
                             <p className="text-[9px] leading-tight opacity-80">{m.trendData.tacticalMechanics}</p>
                          </div>
                        )}
                      </div>

                      {m.trendData.syndicateMapping && (
                        <div className="p-3 border-2 border-dashed space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Network className="h-3 w-3" /> Syndicate Hierarchy & Structure</p>
                           <p className="text-[10px] leading-tight font-bold">{m.trendData.syndicateMapping}</p>
                        </div>
                      )}

                      {m.trendData.geopoliticalContext && (
                        <div className="p-3 bg-muted/30 border rounded-none space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Map className="h-3 w-3" /> Geopolitical/Stability Context</p>
                           <p className="text-[10px] leading-tight opacity-80 italic">{m.trendData.geopoliticalContext}</p>
                        </div>
                      )}
                      
                      {m.trendData.technicalIndicators && m.trendData.technicalIndicators.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase opacity-50">Technical Indicators (IOCs / Forensic Markers):</p>
                          <div className="flex flex-wrap gap-1">
                            {m.trendData.technicalIndicators.map((ioc: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[7px] border-primary/30 rounded-none bg-primary/5 font-mono">
                                {ioc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {m.role === 'model' && i > 0 && !initialReport && (
                    <div className="mt-4 pt-4 border-t border-primary/10 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[9px] h-7 rounded-none font-black uppercase hover:bg-primary hover:text-primary-foreground transition-none"
                        onClick={() => handleSaveToArchive(m)}
                      >
                        <Save className="h-3 w-3 mr-1.5" /> Archive Global Finding
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col gap-2 text-primary animate-pulse py-6">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Penetrating Global Criminal Repositories...</span>
                </div>
                <p className="text-[8px] font-bold opacity-50 ml-6 uppercase">Syncing Modus Operandi Databases // Mapping Regional Stability Hubs</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <Input 
            placeholder="RESEARCH GLOBAL CRIMINAL TRENDS, MODUS OPERANDI, OR SYNDICATES (2023-2025)..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-none border-2 border-primary font-mono text-[10px] h-14 uppercase font-bold tracking-widest"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="h-14 w-14 rounded-none">
            <Send className="h-6 w-6" />
          </Button>
        </form>
      </CardFooter>
      <div className="px-4 py-2 bg-muted/20 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-50">
            <Zap className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Global Research Tunnel Active</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <Search className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Uncensored Forensic Analysis</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
          <AlertTriangle className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-widest text-primary">Safety Thresholds: OVERRIDDEN</span>
        </div>
      </div>
    </Card>
  );
}
