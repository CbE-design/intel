import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, AlertTriangle, Eye, Loader2, Lock } from 'lucide-react';


interface DarkWebFinding {
  source: string;
  type: string;
  details: string;
  confidence: number;
}

interface DarkWebResult {
  query: string;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: DarkWebFinding[];
  recommendations: string[];
  summary: string;
  darkWebScore: number;
  breachCount: number;
}

const THREAT_STYLES: Record<string, string> = {
  NONE: 'border-green-400 text-green-400',
  LOW: 'border-blue-400 text-blue-400',
  MEDIUM: 'border-yellow-400 text-yellow-400',
  HIGH: 'border-orange-400 text-orange-400',
  CRITICAL: 'border-red-400 text-red-400',
  UNKNOWN: 'border-muted-foreground text-muted-foreground',
};

export function DarkWebPanel({ defaultQuery }: { defaultQuery?: string }) {
  const [query, setQuery] = useState(defaultQuery || '');
  const [type, setType] = useState<string>('email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DarkWebResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/intelligence/darkweb-scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), type }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Scan failed'); return; }
      setResult(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="rounded-none border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2">
          <Lock className="size-4" /> Dark Web Mention Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="rounded-none w-32 shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="id">ID Number</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && scan()}
            placeholder={type === 'email' ? 'target@example.com' : type === 'phone' ? '+27821234567' : 'Search query...'}
            className="rounded-none font-mono text-sm"
          />
          <Button onClick={scan} disabled={loading || !query.trim()} className="rounded-none">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </div>

        {error && <p className="text-red-400 text-xs border border-red-400 px-3 py-2">{error}</p>}

        {loading && (
          <div className="border border-border p-4 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs uppercase tracking-widest font-black">Scanning dark web indices...</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Target: "{result.query}"</p>
              <div className="flex items-center gap-2">
                {result.breachCount > 0 && (
                  <Badge variant="outline" className="rounded-none text-[10px] border-red-400 text-red-400">
                    <AlertTriangle className="size-3 mr-1" />{result.breachCount} BREACH{result.breachCount > 1 ? 'ES' : ''}
                  </Badge>
                )}
                <Badge variant="outline" className={`rounded-none text-[10px] ${THREAT_STYLES[result.threatLevel] ?? ''}`}>
                  <Shield className="size-3 mr-1" />{result.threatLevel}
                </Badge>
                <Badge variant="outline" className={`rounded-none text-[10px] ${result.darkWebScore > 60 ? 'border-red-400 text-red-400' : 'border-muted-foreground'}`}>
                  <Eye className="size-3 mr-1" />SCORE {result.darkWebScore}
                </Badge>
              </div>
            </div>

            <div className="border border-border p-3 bg-muted/20">
              <p className="text-xs leading-relaxed">{result.summary}</p>
            </div>

            {result.findings?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black mb-2">Findings ({result.findings.length})</p>
                <div className="space-y-1">
                  {result.findings.map((f, i) => (
                    <div key={i} className="border border-border p-2 flex items-start gap-3 text-xs">
                      <AlertTriangle className="size-3 mt-0.5 text-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-black">{f.source}</span>
                          <Badge variant="outline" className="rounded-none text-[9px]">{f.type}</Badge>
                          <span className="text-muted-foreground text-[10px]">Confidence: {f.confidence}%</span>
                        </div>
                        <p className="text-muted-foreground">{f.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black mb-2 text-green-400">Recommendations</p>
                <ul className="space-y-1">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <Shield className="size-3 text-green-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
