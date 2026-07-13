import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, AlertTriangle, Search, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { PdfExportButton } from '@/components/pdf-export-button';

interface CompanyResult {
  companyName: string;
  registrationNumber: string;
  status: string;
  incorporationDate: string;
  registeredAddress: string;
  industry: string;
  directors: { name: string; id: string; role: string; appointed: string }[];
  riskFlags: string[];
  intelligenceSummary: string;
  riskScore: number;
  ocSource: string | null;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-green-400 border-green-400',
  Dormant: 'text-yellow-400 border-yellow-400',
  Deregistered: 'text-red-400 border-red-400',
  Unknown: 'text-muted-foreground border-border',
};

function CompanyCard({ company, expanded, onToggle }: { company: CompanyResult; expanded: boolean; onToggle: () => void }) {
  return (
    <Card id={`company-card-${company.companyName}`} className="rounded-none border-2 border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm uppercase font-black tracking-wider">{company.companyName}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-1">{company.registrationNumber || 'Reg # Unknown'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`rounded-none text-[10px] ${STATUS_COLORS[company.status] ?? ''}`}>{company.status}</Badge>
            <Badge variant="outline" className="rounded-none text-[10px]">RISK {company.riskScore}/100</Badge>
            <PdfExportButton targetId={`company-card-${company.companyName}`} filename={`company-${company.companyName}`} />
            <Button variant="ghost" size="icon" className="size-7 rounded-none" onClick={onToggle}>
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Industry</p>
              <p className="text-xs font-mono">{company.industry || '—'}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Incorporated</p>
              <p className="text-xs font-mono">{company.incorporationDate || '—'}</p>
            </div>
            <div className="border border-border p-3 col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Registered Address</p>
              <p className="text-xs font-mono">{company.registeredAddress || '—'}</p>
            </div>
          </div>

          {company.directors?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black mb-2 flex items-center gap-1"><Users className="size-3" />Directors ({company.directors.length})</p>
              <div className="space-y-1">
                {company.directors.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 border border-border p-2 text-xs">
                    <span className="font-black">{d.name}</span>
                    <Badge variant="outline" className="rounded-none text-[9px]">{d.role}</Badge>
                    {d.appointed && <span className="text-muted-foreground">Since {d.appointed}</span>}
                    {d.id && <span className="font-mono text-muted-foreground">{d.id}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {company.riskFlags?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black mb-2 flex items-center gap-1 text-red-400"><AlertTriangle className="size-3" />Risk Flags</p>
              <div className="flex flex-wrap gap-1">
                {company.riskFlags.map((f, i) => <Badge key={i} variant="outline" className="rounded-none text-[10px] border-red-400 text-red-400">{f}</Badge>)}
              </div>
            </div>
          )}

          <div className="border border-border p-3 bg-muted/20">
            <p className="text-[10px] uppercase tracking-widest font-black mb-2">Intelligence Summary</p>
            <p className="text-xs leading-relaxed">{company.intelligenceSummary}</p>
            {company.ocSource && <p className="text-[10px] text-muted-foreground mt-2 font-mono">Source: OpenCorporates</p>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function CompanyPage() {
  const [companyInput, setCompanyInput] = useState('');
  const [regInput, setRegInput] = useState('');
  const [result, setResult] = useState<CompanyResult | null>(null);
  const [expanded, setExpanded] = useState(true);

  const { data: history = [] } = useQuery<CompanyResult[]>({
    queryKey: ['company-history'],
    queryFn: () => fetch(`/api/intelligence/company-lookup/history`).then(r => r.json()),
  });

  const lookup = useMutation({
    mutationFn: () => fetch(`/api/intelligence/company-lookup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: companyInput || undefined, registrationNumber: regInput || undefined }),
    }).then(r => r.json()),
    onSuccess: (data) => { setResult(data); setExpanded(true); },
  });

  return (
    <AppLayout>
      <PageHeader title="Company / Director Lookup" />
      <div className="p-4 md:p-6 space-y-4">
        <Card className="rounded-none border-2">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2"><Building2 className="size-4" />CIPC-Style Company Search</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <Input placeholder="Company name (e.g. Steinhoff International)" value={companyInput} onChange={e => setCompanyInput(e.target.value)} className="rounded-none" />
              <div className="text-muted-foreground text-xs flex items-center px-2 shrink-0">OR</div>
              <Input placeholder="Registration number (e.g. 1998/003570/06)" value={regInput} onChange={e => setRegInput(e.target.value)} className="rounded-none font-mono" />
              <Button onClick={() => lookup.mutate()} disabled={(!companyInput && !regInput) || lookup.isPending} className="rounded-none shrink-0">
                {lookup.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Search className="size-4 mr-2" />}
                LOOKUP
              </Button>
            </div>
            {lookup.isError && <p className="text-red-400 text-xs mt-2">Lookup failed — please retry.</p>}
          </CardContent>
        </Card>

        {result && <CompanyCard company={result} expanded={expanded} onToggle={() => setExpanded(e => !e)} />}

        {history.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black mb-3 flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />Previous Lookups</p>
            <div className="space-y-2">
              {history.slice(0, 10).map((c, i) => (
                <div key={i} className="border border-border p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-primary transition-none" onClick={() => { setResult(c); setExpanded(true); }}>
                  <div>
                    <span className="text-sm font-black">{c.company_name ?? c.companyName}</span>
                    <span className="text-xs text-muted-foreground ml-3 font-mono">{c.registration_number ?? c.registrationNumber}</span>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[10px] shrink-0 ${STATUS_COLORS[(c as any).status] ?? ''}`}>{(c as any).status || 'Unknown'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
