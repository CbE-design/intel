import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, AlertTriangle, ExternalLink, Loader2, Eye } from 'lucide-react';


interface Platform {
  name: string;
  status: 'FOUND' | 'NOT_FOUND' | 'UNKNOWN';
  url: string | null;
  notes: string;
}

interface OsintResult {
  query: string;
  platforms: Platform[];
  riskIndicators: string[];
  summary: string;
  exposureScore: number;
}

const STATUS_STYLES: Record<string, string> = {
  FOUND: 'border-green-400 text-green-400',
  NOT_FOUND: 'border-muted-foreground text-muted-foreground opacity-50',
  UNKNOWN: 'border-yellow-400 text-yellow-400',
};

export function SocialOsintPanel({ defaultUsername }: { defaultUsername?: string }) {
  const [input, setInput] = useState(defaultUsername || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OsintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/intelligence/social-osint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: input.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'OSINT sweep failed'); return; }
      setResult(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="rounded-none border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2">
          <Users className="size-4" /> Social Media OSINT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="Username or full name..."
            className="rounded-none font-mono text-sm"
          />
          <Button onClick={run} disabled={loading || !input.trim()} className="rounded-none">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </div>

        {error && <p className="text-red-400 text-xs border border-red-400 px-3 py-2">{error}</p>}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Sweep: "{result.query}"</p>
              <Badge variant="outline" className={`rounded-none text-[10px] ${result.exposureScore > 70 ? 'border-red-400 text-red-400' : result.exposureScore > 40 ? 'border-yellow-400 text-yellow-400' : 'border-green-400 text-green-400'}`}>
                <Eye className="size-3 mr-1" />EXPOSURE {result.exposureScore}
              </Badge>
            </div>

            <div className="border border-border p-3 bg-muted/20">
              <p className="text-xs leading-relaxed">{result.summary}</p>
            </div>

            {result.riskIndicators?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 text-red-400"><AlertTriangle className="size-3" />Risk Indicators</p>
                <div className="flex flex-wrap gap-1">
                  {result.riskIndicators.map((r, i) => <Badge key={i} variant="outline" className="rounded-none text-[10px] border-red-400 text-red-400">{r}</Badge>)}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-widest font-black mb-2">Platform Presence ({result.platforms?.length || 0})</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {result.platforms?.map((p, i) => (
                  <div key={i} className={`border p-2 flex items-center justify-between gap-2 ${p.status === 'FOUND' ? 'border-green-400/50' : 'border-border'}`}>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">{p.name}</p>
                      {p.notes && <p className="text-[10px] text-muted-foreground truncate">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={`rounded-none text-[9px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                      {p.url && p.status === 'FOUND' && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3 text-muted-foreground hover:text-primary" /></a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
