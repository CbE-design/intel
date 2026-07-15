import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Phone, Search, Loader2, Signal, Shield, AlertTriangle,
  Info, ExternalLink, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Wifi, FileText, Eye
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface CarrierInfo {
  network: string;
  type: string;
  color: string;
}

interface OsintFinding {
  source: string;
  type: string;
  value: string;
  url: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface RicaNote {
  title: string;
  summary: string;
  legalRoute: string[];
  operatorContacts: {
    network: string;
    fraudLine: string;
    leuEmail: string;
    subpoenaProcess: string;
  };
  alternativeIntelligence: string[];
}

interface AiAssessment {
  networkAssessment: string;
  simSwapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  simSwapRiskReason: string;
  investigationTips: string[];
  fraudPatterns: string[];
}

interface PhoneResult {
  input: string;
  formatted: string;
  e164: string;
  valid: boolean;
  validationNote: string;
  carrier: CarrierInfo | null;
  prefix: string;
  sources: string[];
  osintFindings: OsintFinding[];
  abstractValidation?: any;
  ricaNote: RicaNote | string | null;
  aiAssessment?: AiAssessment;
  timestamp: string;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  HIGH: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  MEDIUM: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  LOW: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
};

const RISK_STYLE: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

const CARRIER_COLORS: Record<string, string> = {
  Vodacom: 'from-red-600/20 to-red-900/10 border-red-500/30',
  MTN: 'from-yellow-500/20 to-yellow-900/10 border-yellow-500/30',
  'Cell C': 'from-green-600/20 to-green-900/10 border-green-500/30',
  'Telkom Mobile': 'from-rose-600/20 to-rose-900/10 border-rose-500/30',
  VoIP: 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30',
};

function getCarrierStyle(network: string) {
  for (const [key, val] of Object.entries(CARRIER_COLORS)) {
    if (network?.includes(key)) return val;
  }
  return 'from-slate-600/20 to-slate-900/10 border-slate-500/30';
}

export default function PhonePage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PhoneResult | null>(null);
  const [ricaOpen, setRicaOpen] = useState(false);
  const [altOpen, setAltOpen] = useState(false);

  const lookup = useMutation({
    mutationFn: () =>
      fetch('/api/phone/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: input.trim() }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setResult(data);
      setRicaOpen(false);
      setAltOpen(false);
    },
  });

  const ricaNote = result?.ricaNote && typeof result.ricaNote === 'object'
    ? result.ricaNote as RicaNote
    : null;

  return (
    <AppLayout>
      <PageHeader
        title="Phone Number Intelligence"
        subtitle="Carrier ID · Network type · Public OSINT · RICA legal route guide"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Search */}
        <Card className="border border-white/10 bg-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Phone size={15} className="text-indigo-400" />
              SA Phone Number Lookup
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Enter any SA number in any format — 0821234567, +27 82 123 4567, 082 123 4567, etc.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. 0821234567 or +27 82 123 4567"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && input.trim() && lookup.mutate()}
                className="rounded-lg border-white/15 bg-white/5 text-sm font-mono"
              />
              <Button
                onClick={() => lookup.mutate()}
                disabled={!input.trim() || lookup.isPending}
                className="rounded-lg shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-5"
              >
                {lookup.isPending
                  ? <Loader2 size={15} className="animate-spin mr-2" />
                  : <Search size={15} className="mr-2" />}
                Lookup
              </Button>
            </div>
            {lookup.isError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <XCircle size={12} /> Lookup failed — retry.
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">

            {/* Validity + sources banner */}
            <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 ${result.valid ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
              {result.valid
                ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                : <XCircle size={13} className="text-red-400 shrink-0" />}
              <span className="text-xs font-medium text-white font-mono">{result.formatted}</span>
              {result.e164 && <span className="text-xs text-slate-500 font-mono">{result.e164}</span>}
              <span className="text-xs text-slate-400">{result.validationNote}</span>
              {result.sources.length > 0 && (
                <span className="ml-auto text-[10px] text-slate-500">
                  Sources: {result.sources.join(' · ')}
                </span>
              )}
            </div>

            {/* Carrier card */}
            {result.carrier && (
              <div className={`rounded-xl border bg-gradient-to-br p-5 ${getCarrierStyle(result.carrier.network)}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/30 border border-white/10">
                    <Signal size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-0.5">Network Operator</p>
                    <p className="text-xl font-bold text-white">{result.carrier.network}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                        {result.carrier.type}
                      </span>
                      <span className="text-xs text-white/50">Prefix: {result.prefix}X</span>
                      <span className="text-xs text-white/50">·</span>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Wifi size={10} />Verified from SA number prefix database
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Abstract API extra data */}
            {result.abstractValidation && (
              <Card className="border border-white/10 bg-card rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Third-Party Validation (Abstract API)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Line Type', value: result.abstractValidation.lineType },
                      { label: 'Carrier (API)', value: result.abstractValidation.carrier?.name },
                      { label: 'Country', value: result.abstractValidation.country?.name },
                      { label: 'Format', value: result.abstractValidation.format?.international },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-white/8 bg-white/3 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">{label}</p>
                        <p className={`text-xs font-mono ${value ? 'text-white' : 'text-slate-600 italic'}`}>
                          {value ?? 'Unknown'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI assessment */}
            {result.aiAssessment && (
              <Card className="border border-indigo-500/20 bg-card rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                    <Shield size={12} className="text-indigo-400" />
                    Network Intelligence Assessment
                    <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-slate-500 font-normal">AI · based on carrier data only</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">{result.aiAssessment.networkAssessment}</p>

                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                    <AlertTriangle size={13} className={RISK_STYLE[result.aiAssessment.simSwapRisk]} />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">SIM-Swap Risk</p>
                      <p className={`text-sm font-bold ${RISK_STYLE[result.aiAssessment.simSwapRisk]}`}>
                        {result.aiAssessment.simSwapRisk}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 ml-2">{result.aiAssessment.simSwapRiskReason}</p>
                  </div>

                  {result.aiAssessment.fraudPatterns?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Known Fraud Patterns for this Network</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.aiAssessment.fraudPatterns.map((p, i) => (
                          <span key={i} className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.aiAssessment.investigationTips?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Investigation Tips</p>
                      <ul className="space-y-1.5">
                        {result.aiAssessment.investigationTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* OSINT findings */}
            {result.osintFindings.length > 0 && (
              <Card className="border border-white/10 bg-card rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Eye size={12} className="text-indigo-400" />
                    Public OSINT Findings ({result.osintFindings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.osintFindings.map((f, i) => (
                    <div key={i} className="rounded-lg border border-white/8 bg-white/3 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">{f.source}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${CONFIDENCE_STYLE[f.confidence]}`}>
                          {f.confidence}
                        </span>
                        {f.url && (
                          <a href={f.url} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{f.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.osintFindings.length === 0 && result.valid && (
              <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-xs text-slate-500">
                <Info size={12} />
                No public mentions found for this number via automated search. Try manual checks listed below.
              </div>
            )}

            {/* RICA legal route */}
            {ricaNote && (
              <Card className="border border-amber-500/20 bg-card rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-colors"
                  onClick={() => setRicaOpen(o => !o)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30">
                    <FileText size={15} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-300">{ricaNote.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ricaNote.summary.slice(0, 100)}…</p>
                  </div>
                  {ricaOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                </button>

                {ricaOpen && (
                  <div className="border-t border-white/8 px-4 pb-5 pt-4 space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">{ricaNote.summary}</p>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold mb-2">Section 205 CPA Process</p>
                      <ol className="space-y-2">
                        {ricaNote.legalRoute.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-bold text-amber-400">
                              {i + 1}
                            </span>
                            {step.replace(/^\d+\.\s*/, '')}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-lg border border-white/8 bg-white/3 p-3 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                        {ricaNote.operatorContacts.network} Law Enforcement Unit
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">Fraud line: </span>{ricaNote.operatorContacts.fraudLine}
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">LEU email: </span>{ricaNote.operatorContacts.leuEmail}
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">Subpoena: </span>{ricaNote.operatorContacts.subpoenaProcess}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Alternative intelligence methods */}
            {ricaNote && (
              <Card className="border border-white/10 bg-card rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-colors"
                  onClick={() => setAltOpen(o => !o)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30">
                    <Eye size={15} className="text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Manual OSINT Methods</p>
                    <p className="text-xs text-slate-500 mt-0.5">Alternative intelligence gathering without legal process</p>
                  </div>
                  {altOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                </button>

                {altOpen && (
                  <div className="border-t border-white/8 px-4 pb-4 pt-3">
                    <ul className="space-y-2">
                      {ricaNote.alternativeIntelligence.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
                      <p className="text-xs text-indigo-300 flex items-center gap-1.5">
                        <Info size={11} />
                        Manual checks often yield faster results than legal process for preliminary identification.
                        Confirm identity via legal route before formal case submission.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/30">
              <Phone size={24} className="text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Phone Number Intelligence</p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Enter any SA mobile or landline number. Instantly identifies the carrier, line type, and coverage area.
              Includes RICA legal process guide for subscriber data requests.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
