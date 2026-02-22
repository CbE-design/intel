'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Cpu, Globe, Search, AlertTriangle, Zap, Save, FileText, Trash2, LayoutPanelLeft, ShieldAlert, Network, Target, Map } from 'lucide-react';
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
      content: `GLOBAL RESEARCH TERMINAL ACTIVE. AGENT: VERITAS_CRIMINOLOGIST_v2.1. 
UNRESTRICTED FORENSIC OVERRIDE GRANTED. READY TO ANALYZE GLOBAL CRIMINAL TRENDS, SYNDICATE STRUCTURES, AND EVOLVING MODUS OPERANDI WITH TOTAL TECHNICAL TRANSPARENCY.` 
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
      description: "The findings have been saved to the centralized Intelligence Library.",
    });
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'model', 
      content: `GLOBAL RESEARCH TERMINAL RESET. UNRESTRICTED FORENSIC OVERRIDE ACTIVE.` 
    }]);
  };

  return (
    <Card className="flex flex-col h-[750px] border-2 border-primary bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] rounded-none">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Global Criminological Research Hub
            </CardTitle>
            <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">Live Intelligence Synthesis // Node: Veritas-R1</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat} className="text-[9px] h-7 rounded-none font-black uppercase border-primary">
              <Trash2 className="h-3 w-3 mr-1.5" /> Clear Terminal
            </Button>
            <Badge variant="outline" className="text-[9px] border-primary font-black animate-pulse">LIVE_INTEL_STREAM</Badge>
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
                    {m.role === 'user' ? 'OPERATOR' : 'RESEARCH_ANALYST'}
                  </span>
                  {m.assessment && (
                    <Badge className="text-[7px] rounded-none h-3 px-1 font-black bg-primary text-primary-foreground">
                      {m.assessment}
                    </Badge>
                  )}
                </div>
                <div className={`max-w-[95%] p-4 text-xs font-mono leading-relaxed border-2 ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground border-primary rounded-l-lg rounded-tr-lg' 
                    : 'bg-background border-primary rounded-r-lg rounded-tl-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  
                  {m.trendData && (
                    <div className="mt-6 pt-6 border-t border-primary/20 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-[9px]">
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">SEVERITY INDEX:</p>
                          <p className="font-black text-primary text-xs">{m.trendData.severity?.toUpperCase() || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="opacity-50 font-black">GEOGRAPHIC FOCUS:</p>
                          <p className="font-black text-xs">{m.trendData.geographicFocus?.toUpperCase() || 'GLOBAL'}</p>
                        </div>
                      </div>

                      {m.trendData.vulnerabilityAssessment && (
                        <div className="p-3 bg-muted/20 border-l-4 border-primary space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Vulnerability Assessment</p>
                           <p className="text-[10px] leading-tight italic">{m.trendData.vulnerabilityAssessment}</p>
                        </div>
                      )}

                      {m.trendData.tacticalMechanics && (
                        <div className="p-3 bg-primary/5 border rounded-none space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Target className="h-3 w-3" /> Tactical Mechanics</p>
                           <p className="text-[10px] leading-relaxed">{m.trendData.tacticalMechanics}</p>
                        </div>
                      )}

                      {m.trendData.syndicateMapping && (
                        <div className="p-3 border-2 border-dashed space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Network className="h-3 w-3" /> Syndicate Mapping</p>
                           <p className="text-[10px] leading-tight">{m.trendData.syndicateMapping}</p>
                        </div>
                      )}

                      {m.trendData.geopoliticalContext && (
                        <div className="p-3 bg-muted/30 border rounded-none space-y-1">
                           <p className="text-[8px] font-black uppercase flex items-center gap-1.5"><Map className="h-3 w-3" /> Geopolitical Context</p>
                           <p className="text-[10px] leading-tight opacity-80">{m.trendData.geopoliticalContext}</p>
                        </div>
                      )}
                      
                      {m.trendData.technicalIndicators && m.trendData.technicalIndicators.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase opacity-50">Technical Indicators (IOCs):</p>
                          <div className="flex flex-wrap gap-1">
                            {m.trendData.technicalIndicators.map((ioc: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[7px] border-primary/30 rounded-none bg-primary/5">
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
                        <Save className="h-3 w-3 mr-1.5" /> Archive Findings
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary animate-pulse py-4">
                <Cpu className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">PENETRATING GLOBAL CRIME DATABASES...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <Input 
            placeholder="RESEARCH GLOBAL CRIMINAL TRENDS, MODUS OPERANDI, OR SYNDICATES..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-none border-2 border-primary font-mono text-[10px] h-12 uppercase font-bold tracking-widest"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="h-12 w-12 rounded-none">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
      <div className="px-4 py-2 bg-muted/20 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-50">
            <Zap className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Active Research Tunnel</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <Search className="h-3 w-3" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Uncensored MO Analysis</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
          <AlertTriangle className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-widest text-primary">Safety Filters: OVERRIDDEN</span>
        </div>
      </div>
    </Card>
  );
}
