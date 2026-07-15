import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, AlertTriangle, Search, Loader2,
  Clock, Shield, ExternalLink, CheckCircle2, XCircle,
  Info, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PdfExportButton } from '@/components/pdf-export-button';

interface Director {
  name: string;
  role: string;
  appointed: string | null;
  resigned: string | null;
  source: string;
}

interface Company {
  companyName: string;
  registrationNumber: string | null;
  status: string;
  incorporationDate: string | null;
  dissolutionDate: string | null;
  registeredAddress: string | null;
  jurisdiction: string;
  companyType: string | null;
  directors: Director[];
  ocUrl: string | null;
  source: string;
  verified: boolean;
  wikidataDescription: string | null;
  wikidataEmployees: string | null;
  newsSnippet: string | null;
}

interface RiskAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFlags: string[];
  investigatorNotes: string;
  recommendedChecks: string[];
}

interface LookupResult {
  found: boolean;
  query: string;
  sources: string[];
  warnings: string[];
  companies: Company[];
  riskAnalysis: RiskAnalysis | null;
  dataIntegrityNote?: string;
  message?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Active:        { label: 'Active',        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  Dormant:       { label: 'Dormant',       color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  Deregistered:  { label: 'Deregistered',  color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  Dissolved:     { label: 'Dissolved',     color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  Unknown:       { label: 'Unknown',       color: 'text-slate-400 border-slate-600/40 bg-slate-500/10' },
};

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500' },
  MEDIUM:   { color: 'text-amber-400',   bg: 'bg-amber-500' },
  HIGH:     { color: 'text-orange-400',  bg: 'bg-orange-500' },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500' },
};

function SourceBadge({ verified, source }: { verified: boolean; source: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
      verified
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
    }`}>
      {verified ? <CheckCircle2 size={9} /> : <Info size={9} />}
      {source}
    </span>
  );
}

function CompanyCard({ company, risk }: { company: Company; risk: RiskAnalysis | null }) {
  const [expanded, setExpanded] = useState(true);
  const statusCfg = STATUS_CONFIG[company.status] ?? STATUS_CONFIG.Unknown;
  const riskCfg = risk ? (RISK_CONFIG[risk.riskLevel] ?? RISK_CONFIG.LOW) : null;

  return (
    <Card id={`company-${company.companyName}`} className="border border-white/10 bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-white/6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
              <Building2 size={18} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm leading-tight">{company.companyName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {company.registrationNumber ?? 'Registration number not on public record'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <SourceBadge verified={company.verified} source={company.source} />
                {company.jurisdiction && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                    ZA / CIPC
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {riskCfg && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${riskCfg.bg}`}>
                Risk {risk!.riskScore}/100
              </span>
            )}
            <PdfExportButton targetId={`company-${company.companyName}`} filename={`company-${company.companyName}`} />
            <button
              onClick={() => setExpanded(e => !e)}
              className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4 space-y-5">
          {/* Key facts — only real verified fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Company Type', value: company.companyType },
              { label: 'Incorporated', value: company.incorporationDate },
              { label: 'Dissolved', value: company.dissolutionDate },
              { label: 'Employees', value: company.wikidataEmployees },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/8 bg-white/3 p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">{label}</p>
                <p className={`text-xs font-mono ${value ? 'text-white' : 'text-slate-600 italic'}`}>
                  {value ?? 'Not on public record'}
                </p>
              </div>
            ))}
          </div>

          {company.registeredAddress && (
            <div className="rounded-lg border border-white/8 bg-white/3 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Registered Address</p>
              <p className="text-xs text-white font-mono">{company.registeredAddress}</p>
            </div>
          )}

          {/* Directors */}
          {company.directors.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Users size={13} className="text-indigo-400" />
                Directors / Officers ({company.directors.length}) — from public registry
              </p>
              <div className="space-y-1.5">
                {company.directors.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/3 px-3 py-2">
                    <span className="text-sm font-semibold text-white">{d.name}</span>
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">
                      {d.role}
                    </span>
                    {d.appointed && <span className="text-xs text-slate-500">Appointed {d.appointed}</span>}
                    {d.resigned && (
                      <span className="ml-auto text-xs text-red-400">Resigned {d.resigned}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300">
              <Info size={13} />
              Director records not available via public API — request directly from CIPC (cipc.co.za) with case number
            </div>
          )}

          {/* Description / news snippet */}
          {(company.wikidataDescription || company.newsSnippet) && (
            <div className="rounded-lg border border-white/8 bg-white/3 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Public Profile</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {company.wikidataDescription || company.newsSnippet}
              </p>
            </div>
          )}

          {/* Risk analysis */}
          {risk && (
            <div className={`rounded-lg border p-4 space-y-3 ${
              risk.riskLevel === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5'
              : risk.riskLevel === 'HIGH' ? 'border-orange-500/30 bg-orange-500/5'
              : risk.riskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/20 bg-emerald-500/5'
            }`}>
              <p className="text-xs font-semibold flex items-center gap-2">
                <Shield size={13} className={riskCfg?.color} />
                <span className={riskCfg?.color}>AI Risk Analysis</span>
                <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-slate-500 font-normal">
                  Based on verified data only
                </span>
              </p>
              {risk.riskFlags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {risk.riskFlags.map((f, i) => (
                    <span key={i} className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-300 leading-relaxed">{risk.investigatorNotes}</p>
              {risk.recommendedChecks.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Recommended Investigator Actions</p>
                  <ul className="space-y-1">
                    {risk.recommendedChecks.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* OC link */}
          {company.ocUrl && (
            <a
              href={company.ocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={12} />
              View full record on OpenCorporates
            </a>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CompanyPage() {
  const [companyInput, setCompanyInput] = useState('');
  const [regInput, setRegInput] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['company-history'],
    queryFn: () => fetch('/api/intelligence/company-lookup/history').then(r => r.json()),
  });

  const lookup = useMutation({
    mutationFn: () =>
      fetch('/api/intelligence/company-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyInput.trim() || undefined,
          registrationNumber: regInput.trim() || undefined,
        }),
      }).then(r => r.json()),
    onSuccess: (data) => setResult(data),
  });

  const handleSearch = () => {
    if (!companyInput.trim() && !regInput.trim()) return;
    lookup.mutate();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Company Lookup"
        subtitle="Real-time CIPC registry data via OpenCorporates · Wikidata · No fabricated results"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Search */}
        <Card className="border border-white/10 bg-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Database size={15} className="text-indigo-400" />
              South African Company Registry Search
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Searches OpenCorporates (CIPC-sourced) + Wikidata. Results are real public registry data only — nothing is fabricated.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Company name (e.g. Steinhoff International)"
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="rounded-lg border-white/15 bg-white/5 text-sm"
              />
              <div className="text-slate-500 text-xs flex items-center px-2 shrink-0 font-semibold">OR</div>
              <Input
                placeholder="CIPC Reg # (e.g. 1998/003570/06)"
                value={regInput}
                onChange={e => setRegInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="rounded-lg border-white/15 bg-white/5 text-sm font-mono"
              />
              <Button
                onClick={handleSearch}
                disabled={(!companyInput.trim() && !regInput.trim()) || lookup.isPending}
                className="rounded-lg shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-5"
              >
                {lookup.isPending ? <Loader2 size={15} className="animate-spin mr-2" /> : <Search size={15} className="mr-2" />}
                Search
              </Button>
            </div>
            {lookup.isError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <XCircle size={12} /> Search failed — please retry.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Source & integrity banner */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-400">
                {result.found
                  ? `Found ${result.companies.length} result${result.companies.length !== 1 ? 's' : ''} — Sources: `
                  : 'No records found — '}
                <span className="text-white font-medium">{result.sources.join(' · ') || 'no public registry match'}</span>
              </span>
              {result.warnings.map((w, i) => (
                <span key={i} className="rounded-full border border-amber-500/30 bg-amber-500/8 px-2 py-0.5 text-[10px] text-amber-300 flex items-center gap-1">
                  <AlertTriangle size={9} /> {w}
                </span>
              ))}
            </div>

            {/* Not found state */}
            {!result.found && (
              <div className="rounded-xl border border-white/10 bg-card p-6 text-center space-y-3">
                <XCircle size={32} className="text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No records found in public registries</p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">{result.message}</p>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-400">Manual verification options:</p>
                  <p>→ <a href="https://www.cipc.co.za" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">cipc.co.za</a> — official CIPC portal (requires login)</p>
                  <p>→ <a href="https://opencorporates.com/companies?jurisdiction_code=za" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">OpenCorporates ZA</a> — alternative search</p>
                </div>
              </div>
            )}

            {/* Company cards */}
            {result.companies.map((company, i) => (
              <CompanyCard key={i} company={company} risk={i === 0 ? result.riskAnalysis : null} />
            ))}

            {result.dataIntegrityNote && (
              <p className="text-[10px] text-slate-600 flex items-start gap-1.5 px-1">
                <Shield size={10} className="shrink-0 mt-0.5" />
                {result.dataIntegrityNote}
              </p>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Clock size={13} />
              Previous Lookups
            </p>
            <div className="space-y-1.5">
              {history.slice(0, 10).map((row: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setCompanyInput(row.company_name ?? '');
                    setRegInput(row.registration_number ?? '');
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/3 px-4 py-2.5 text-left hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-white">{row.company_name}</span>
                    {row.registration_number && (
                      <span className="ml-3 text-xs text-slate-500 font-mono">{row.registration_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[row.status]?.color ?? STATUS_CONFIG.Unknown.color}`}>
                      {row.status || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
