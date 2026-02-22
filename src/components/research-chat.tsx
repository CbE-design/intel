
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Cpu, Globe, Search, AlertTriangle, Zap, Save, FileText, History } from 'lucide-react';
import { performGlobalResearchAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
  assessment?: string;
  trendData?: any;
}

export function ResearchChat() {
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

    const reportData = {
      topic: messages.find((m, i) => messages[i+1] === message)?.content || 'Untitled Research',
      content: message.content,
      assessment: message.assessment,
      trendData: message.trendData,
      timestamp: serverTimestamp(),
      analyst: 'Veritas Intelligence Agent'
    };

    addDocumentNonBlocking(collection(firestore, 'research_reports'), reportData);

    toast({
      title: "Research Dossier Archived",
      description: "The findings have been saved to the centralized Intelligence Library.",
    });
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
            <Badge variant="outline" className="text-[9px] border-primary font-black animate-pulse">LIVE_INTEL_STREAM</Badge>
            <Badge variant="outline" className="text-[9px] border-primary font-black bg-primary text-primary-foreground">UNRESTRICTED_FORENSIC_OVERRIDE</Badge>
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
                <div className={`max-w-[90%] p-4 text-xs font-mono leading-relaxed border-2 ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground border-primary rounded-l-lg rounded-tr-lg' 
                    : 'bg-background border-primary rounded-r-lg rounded-tl-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  
                  {m.trendData && (
                    <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-2 gap-2 text-[9px]">
                      {m.trendData.severity && (
                        <div className="flex justify-between">
                          <span className="opacity-50">SEVERITY:</span>
                          <span className="font-black">{m.trendData.severity.toUpperCase()}</span>
                        </div>
                      )}
                      {m.trendData.geographicFocus && (
                        <div className="flex justify-between">
                          <span className="opacity-50">LOCATION:</span>
                          <span className="font-black">{m.trendData.geographicFocus.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {m.role === 'model' && i > 0 && (
                    <div className="mt-4 pt-4 border-t border-primary/10 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[9px] h-7 rounded-none font-black uppercase"
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
            placeholder="RESEARCH CRIMINAL TRENDS, MODUS OPERANDI, OR GLOBAL SYNDICATES..." 
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
