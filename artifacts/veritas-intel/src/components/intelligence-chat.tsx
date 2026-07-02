'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Activity, ShieldAlert, Cpu, AlertTriangle, Search } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { interrogateSubjectAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { sanitizeForServer } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  assessment?: string;
}

export function IntelligenceChat({ subject, dossierContext }: { subject: Subject, dossierContext?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: `INTEL TUNNEL ACTIVE. AGENT: VERITAS_CRIMINOLOGIST_v2.1. 
READY TO ANALYZE SUBJECT: ${subject.name.toUpperCase()} OR RESEARCH GLOBAL CRIMINAL TRENDS. 
UNRESTRICTED FORENSIC OVERRIDE ENGAGED.` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pre-sanitize the subject for server action safety
  const plainSubject = useMemo(() => sanitizeForServer(subject), [subject]);

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

    const result = await interrogateSubjectAction(plainSubject, userMessage, dossierContext);

    if (result.error) {
      const isQuota = result.statusCode === 429 || result.isQuota;
      const msg = isQuota
        ? `[ QUOTA LIMIT REACHED ]\n\nThe free AI tier limit has been hit for today. Options:\n• Wait a few minutes and retry\n• Upgrade your Google AI plan at ai.google.dev\n• Your API key: GOOGLE_API_KEY in Replit Secrets`
        : `[ ANALYST OFFLINE ]\n\n${result.error}`;
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
    } else if (result.response) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: result.response?.response || 'No response data.',
        assessment: result.response?.assessment
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="flex flex-col h-[600px] md:h-[700px] border-2 border-primary bg-background shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] rounded-none">
      <CardHeader className="border-b bg-muted/30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Tactical Interface
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[8px] md:text-[9px] border-primary font-black animate-pulse">UNRESTRICTED</Badge>
            <Badge variant="outline" className="text-[8px] md:text-[9px] border-primary font-black bg-primary text-primary-foreground hidden sm:inline-flex">FORENSIC_ACTIVE</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 bg-black/5 dark:bg-white/5">
        <ScrollArea className="h-full p-3 md:p-4" ref={scrollRef}>
          <div className="space-y-4 md:space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[7px] md:text-[8px] font-black uppercase opacity-50 tracking-widest">
                    {m.role === 'user' ? 'OPERATOR' : 'VERITAS_ANALYST'}
                  </span>
                  {m.assessment && (
                    <Badge variant={m.assessment === 'CRITICAL' ? 'destructive' : 'default'} className="text-[6px] md:text-[7px] rounded-none h-3 px-1">
                      {m.assessment}
                    </Badge>
                  )}
                </div>
                <div className={`max-w-[90%] md:max-w-[85%] p-3 text-[10px] md:text-xs font-mono leading-relaxed border-2 ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground border-primary rounded-l-md rounded-tr-md' 
                    : 'bg-background border-primary rounded-r-md rounded-tl-md shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <Cpu className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Synthesizing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 md:p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <Input 
            placeholder="INTERROGATE..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-none border-2 border-primary font-mono text-[9px] md:text-[10px] h-10 md:h-12 uppercase font-bold tracking-widest"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="h-10 w-10 md:h-12 md:w-12 rounded-none shrink-0">
            <Send className="h-4 w-4 md:h-5 md:h-5" />
          </Button>
        </form>
      </CardFooter>
      <div className="px-3 py-1.5 md:px-4 md:py-2 bg-muted/20 border-t flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-50">
            <ShieldAlert className="h-2.5 w-2.5" />
            <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-widest">OVERRIDE ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-50">
          <AlertTriangle className="h-2.5 w-2.5" />
          <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-widest">SAFETY: MIN</span>
        </div>
      </div>
    </Card>
  );
}
