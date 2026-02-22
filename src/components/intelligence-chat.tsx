'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Activity, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { interrogateSubjectAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'model';
  content: string;
  assessment?: string;
}

export function IntelligenceChat({ subject, dossierContext }: { subject: Subject, dossierContext?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `INTELLIGENCE TUNNEL ESTABLISHED. READY TO ANALYZE SUBJECT: ${subject.name.toUpperCase()}. PROMPT FOR CRIMINAL PATTERNS OR NETWORK VULNERABILITIES.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    const result = await interrogateSubjectAction(subject, userMessage, dossierContext);

    if (result.error) {
      setMessages(prev => [...prev, { role: 'model', content: `CRITICAL ERROR: ${result.error}` }]);
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
    <Card className="flex flex-col h-[600px] border-2 border-primary bg-background shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] rounded-none">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Tactical Interrogation Interface
          </CardTitle>
          <Badge variant="outline" className="text-[9px] border-primary font-black animate-pulse">UNRESTRICTED_ACCESS</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 bg-black/5 dark:bg-white/5">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">
                    {m.role === 'user' ? 'OPERATOR' : 'VERITAS_AI'}
                  </span>
                  {m.assessment && (
                    <Badge variant={m.assessment === 'CRITICAL' ? 'destructive' : 'default'} className="text-[7px] rounded-none h-3 px-1">
                      {m.assessment}
                    </Badge>
                  )}
                </div>
                <div className={`max-w-[85%] p-3 text-xs font-mono leading-relaxed border-2 ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground border-primary rounded-l-lg rounded-tr-lg' 
                    : 'bg-background border-primary rounded-r-lg rounded-tl-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <Cpu className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Synthesizing Unrestricted Analysis...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <Input 
            placeholder="INTERROGATE SUBJECT METADATA..." 
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
      <div className="px-4 py-2 bg-muted/20 border-t flex items-center gap-4">
        <div className="flex items-center gap-1.5 opacity-50">
          <ShieldAlert className="h-3 w-3" />
          <span className="text-[7px] font-bold uppercase tracking-widest">Security Override Active</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-[7px] font-bold uppercase tracking-widest">Safety Thresholds: Minimized</span>
        </div>
      </div>
    </Card>
  );
}
