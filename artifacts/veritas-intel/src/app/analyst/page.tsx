import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Send, Loader2, User, Trash2, Copy, CheckCheck,
  ShieldAlert, Zap, Clock, Wifi
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

const SUGGESTED = [
  'Explain how SIM-swap fraud works in SA and how to investigate it',
  'What are the latest BEC (Business Email Compromise) tactics hitting SA companies?',
  'How do 419 advance fee syndicates recruit money mules?',
  'Walk me through tracing cryptocurrency in a fraud case',
  'What legislation applies to cybercrime investigations in South Africa?',
  'How do I identify a Ponzi scheme before it collapses?',
  'Explain bond/title deed fraud and how to detect it',
  'What are the red flags of trade-based money laundering?',
];

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      <div className={`size-9 rounded-none border-2 flex items-center justify-center shrink-0 ${isUser ? 'border-primary bg-primary text-primary-foreground' : 'border-red-500 bg-red-950 text-red-400'}`}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={`flex-1 min-w-0 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
            {isUser ? 'INVESTIGATOR' : 'VERIBOT'}
          </span>
          {!isUser && (
            <Badge variant="outline" className="rounded-none text-[9px] border-red-500 text-red-400 px-1 py-0">
              FRAUD SPECIALIST
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground font-mono">
            {msg.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <div className={`relative border-2 px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-red-500/40 bg-red-950/20 text-foreground'
        }`}>
          {msg.streaming && !msg.content ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </span>
          ) : (
            <pre className="whitespace-pre-wrap font-sans break-words">{msg.content}</pre>
          )}
          {msg.streaming && msg.content && (
            <span className="inline-block w-0.5 h-4 bg-red-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        {!msg.streaming && msg.content && (
          <button
            onClick={copy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {copied ? <CheckCheck className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `VERIBOT online. Fraud & Crime Intelligence Specialist — operational 24/7/365.

I have deep expertise in South African fraud, cybercrime, organised crime, and financial crime investigation. No topic is off-limits for professional investigative purposes.

Ask me anything: fraud typologies, investigation tactics, criminal MOs, legislation, evidence collection, financial tracing, syndicate structures, or case strategy.

How can I assist your investigation?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    setInput('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const response = await fetch('/api/analyst/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `Error: ${err.error}`, streaming: false } : m
        ));
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.delta) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + parsed.delta } : m
              ));
            }
            if (parsed.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, streaming: false } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: 'Connection interrupted. Please retry.', streaming: false } : m
      ));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }, [input, isStreaming, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([{
      id: 'welcome-reset',
      role: 'assistant',
      content: 'Session cleared. VERIBOT ready for new inquiry.',
      timestamp: new Date(),
    }]);
  };

  return (
    <AppLayout>
      <PageHeader title="VERIBOT — Fraud Analyst">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-green-400">
            <Wifi className="size-3 animate-pulse" /> LIVE
          </span>
          <Badge variant="outline" className="rounded-none border-red-500 text-red-400 text-[10px] font-black hidden md:flex">
            <ShieldAlert className="size-3 mr-1" />FRAUD SPECIALIST
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none text-[10px] uppercase font-black"
            onClick={clearChat}
          >
            <Trash2 className="size-3 mr-1" />Clear
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Status bar */}
        <div className="border-b border-border bg-muted/20 px-4 py-2 flex items-center gap-4 text-[10px] uppercase tracking-widest font-black text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="size-3 text-yellow-400" />Groq llama-3.3-70b</span>
          <span className="flex items-center gap-1"><Clock className="size-3" />24/7 Available</span>
          <span className="flex items-center gap-1"><ShieldAlert className="size-3 text-red-400" />Uncensored Professional Mode</span>
          <span className="ml-auto text-green-400 flex items-center gap-1"><Bot className="size-3" />{messages.length - 1} exchanges</span>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="max-w-4xl mx-auto space-y-6 pb-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 max-w-4xl mx-auto w-full">
            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Quick intelligence queries</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={isStreaming}
                  className="text-left text-xs border border-border hover:border-red-500 hover:bg-red-950/20 px-3 py-2 transition-none text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t-2 border-primary bg-background px-4 py-4">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask VERIBOT anything about fraud, cybercrime, investigation tactics, legislation, evidence collection..."
              className="rounded-none resize-none border-2 text-sm min-h-[52px] max-h-40 font-mono"
              rows={2}
              disabled={isStreaming}
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || isStreaming}
              className="rounded-none h-[52px] px-4 shrink-0"
            >
              {isStreaming
                ? <Loader2 className="size-4 animate-spin" />
                : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 max-w-4xl mx-auto">
            Enter to send · Shift+Enter for new line · Professional investigative use only · Powered by Groq
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
