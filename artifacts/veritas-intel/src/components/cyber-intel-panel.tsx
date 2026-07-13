'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Cpu, Globe, Phone, Search, ShieldCheck, ShieldAlert,
  Wifi, Server, AlertTriangle, CheckCircle2, XCircle,
  Loader2, MapPin, Clock, Building, Hash, Key, Mail,
} from 'lucide-react';
import type { Subject, SAIDDecodeResult, PhoneIntelligence, IPIntelligence, DomainIntelligence } from '@/lib/types';

const API_BASE = '/api/intelligence';

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── SA ID Decode Panel ─────────────────────────────────────────────────────
function IDDecodeSection({ idNumber }: { idNumber: string }) {
  const [data, setData] = useState<SAIDDecodeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idNumber) return;
    setLoading(true);
    post<SAIDDecodeResult>('/sa-id-decode', { idNumber })
      .then(setData)
      .finally(() => setLoading(false));
  }, [idNumber]);

  return (
    <Card className="rounded-none border-2 border-primary">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-primary" /> SA ID Decode
        </CardTitle>
        <CardDescription className="text-[9px]">Luhn validation + biometric metadata extraction</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Decoding...
          </div>
        ) : !data ? (
          <p className="text-xs text-muted-foreground">No data.</p>
        ) : !data.isValid ? (
          <div className="flex items-center gap-2 text-destructive text-xs font-bold">
            <ShieldAlert className="h-4 w-4" /> {data.error || 'ID FAILED LUHN CHECKSUM — POSSIBLE FRAUD'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Status', value: 'VERIFIED', highlight: true },
              { label: 'Date of Birth', value: data.dob ?? '—' },
              { label: 'Age', value: data.age !== undefined ? `${data.age} years` : '—' },
              { label: 'Gender', value: data.gender ?? '—' },
              { label: 'Citizenship', value: data.citizenship ?? '—' },
              { label: 'Gender Seq', value: data.genderSequence ?? '—' },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="p-2.5 border bg-muted/5 space-y-0.5">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
                <p className={`text-xs font-black uppercase truncate ${highlight ? 'text-primary' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Phone Intelligence Section ─────────────────────────────────────────────
function PhoneIntelSection({ phone }: { phone: string }) {
  const [data, setData] = useState<PhoneIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    post<PhoneIntelligence>('/phone-validate', { phone })
      .then(setData)
      .finally(() => setLoading(false));
  }, [phone]);

  return (
    <Card className="rounded-none border-2 border-primary">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-primary" /> Phone Intelligence
        </CardTitle>
        <CardDescription className="text-[9px]">Number validation, carrier type, and international format</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Querying...
          </div>
        ) : !data ? (
          <p className="text-xs text-muted-foreground">No data.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {data.isValid
                ? <CheckCircle2 className="h-4 w-4 text-primary" />
                : <XCircle className="h-4 w-4 text-destructive" />}
              <span className={`text-xs font-black uppercase ${data.isValid ? 'text-primary' : 'text-destructive'}`}>
                {data.isValid ? 'Valid Number' : 'Invalid / Unrecognised'}
              </span>
              {data.lineType && (
                <Badge variant="outline" className="text-[8px] rounded-none font-black h-5">{data.lineType}</Badge>
              )}
            </div>
            {data.isValid && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'International', value: data.international },
                  { label: 'National', value: data.national },
                  { label: 'Country', value: data.country },
                  { label: 'Calling Code', value: data.countryCallingCode },
                  { label: 'National No.', value: data.nationalNumber },
                  { label: 'URI', value: data.uri },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="p-2.5 border bg-muted/5 space-y-0.5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
                    <p className="text-xs font-mono truncate">{value}</p>
                  </div>
                ) : null)}
              </div>
            )}
            {data.error && (
              <p className="text-xs text-destructive font-mono">{data.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── IP Intelligence Section ────────────────────────────────────────────────
function IPIntelSection() {
  const [ip, setIp] = useState('');
  const [data, setData] = useState<IPIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!ip.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const result = await post<IPIntelligence & { error?: string }>('/ip-lookup', { ip: ip.trim() });
      if ('error' in result && result.error) { setError(result.error); }
      else setData(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="rounded-none border-2 border-primary">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" /> IP Intelligence
        </CardTitle>
        <CardDescription className="text-[9px]">Geolocation, ISP, open ports & vulnerability flags via ip-api.com + Shodan InternetDB</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 102.165.4.12"
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            className="rounded-none border-2 font-mono text-xs h-8 flex-1"
          />
          <Button onClick={lookup} disabled={loading} size="sm" className="rounded-none font-black h-8 px-4">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive font-mono">{error}</p>}

        {data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: MapPin, label: 'Location', value: [data.city, data.region, data.country].filter(Boolean).join(', ') || '—' },
                { icon: Building, label: 'ISP / Org', value: data.isp || '—' },
                { icon: Clock, label: 'Timezone', value: data.timezone || '—' },
                { icon: Server, label: 'ASN', value: data.asn || '—' },
                { icon: Wifi, label: 'Open Ports', value: data.ports.length > 0 ? data.ports.join(', ') : 'None detected' },
                { icon: AlertTriangle, label: 'Vulns', value: data.vulns.length > 0 ? data.vulns.join(', ') : 'None detected' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-2.5 border bg-muted/5 space-y-0.5">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                    <Icon className="h-2.5 w-2.5" /> {label}
                  </p>
                  <p className="text-[10px] font-mono break-all">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {data.isMobile && <Badge variant="outline" className="text-[8px] rounded-none font-black h-5">MOBILE</Badge>}
              {data.isProxy && <Badge variant="destructive" className="text-[8px] rounded-none font-black h-5">PROXY / VPN</Badge>}
              {data.isHosting && <Badge variant="outline" className="text-[8px] rounded-none font-black h-5 border-primary/50">HOSTING / DC</Badge>}
              {data.tags.map(t => <Badge key={t} variant="outline" className="text-[8px] rounded-none font-black h-5">{t.toUpperCase()}</Badge>)}
              {data.hostnames.slice(0, 3).map(h => (
                <Badge key={h} variant="secondary" className="text-[8px] rounded-none font-mono h-5">{h}</Badge>
              ))}
            </div>

            {data.vulns.length > 0 && (
              <div className="p-3 border-l-4 border-destructive bg-destructive/5">
                <p className="text-[9px] font-black uppercase text-destructive mb-1 tracking-widest">Known Vulnerabilities</p>
                <div className="space-y-0.5">
                  {data.vulns.map(v => (
                    <p key={v} className="text-[9px] font-mono text-destructive">{v}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Domain Intelligence Section ────────────────────────────────────────────
function DomainIntelSection() {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState<DomainIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!domain.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const result = await post<DomainIntelligence & { error?: string }>('/domain-intel', { domain: domain.trim() });
      if ('error' in result && result.error) { setError(result.error); }
      else setData(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="rounded-none border-2 border-primary">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-primary" /> Domain Intelligence
        </CardTitle>
        <CardDescription className="text-[9px]">DNS records (A, MX, NS, TXT) + certificate transparency via crt.sh</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. example.co.za"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            className="rounded-none border-2 font-mono text-xs h-8 flex-1"
          />
          <Button onClick={lookup} disabled={loading} size="sm" className="rounded-none font-black h-8 px-4">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive font-mono">{error}</p>}

        {data && (
          <div className="space-y-4">
            {/* DNS Records */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'A Records (IPv4)', values: data.aRecords },
                { label: 'NS Records', values: data.nsRecords },
                { label: 'MX Records', values: data.mxRecords },
                { label: 'TXT Records', values: data.txtRecords.slice(0, 3) },
              ].map(({ label, values }) => (
                <div key={label} className="p-2.5 border bg-muted/5 space-y-1">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
                  {values.length > 0
                    ? values.map((v, i) => <p key={i} className="text-[9px] font-mono break-all">{v}</p>)
                    : <p className="text-[9px] text-muted-foreground italic">None</p>
                  }
                </div>
              ))}
            </div>

            {/* Certificates */}
            {data.certificates.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  Certificate Transparency — {data.certificates.length} entries
                </p>
                <ScrollArea className="h-40">
                  <div className="space-y-1.5 pr-2">
                    {data.certificates.map((cert, i) => (
                      <div key={cert.id ?? i} className="flex items-start justify-between gap-2 p-2 border bg-muted/5 text-[9px]">
                        <div className="min-w-0">
                          <p className="font-mono font-bold truncate">{cert.commonName}</p>
                          <p className="text-muted-foreground truncate">{cert.issuer}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-[8px]">{cert.notBefore?.slice(0, 10)}</p>
                          <p className="font-mono text-[8px] text-muted-foreground">→ {cert.notAfter?.slice(0, 10)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Email Intelligence Section ─────────────────────────────────────────────
function EmailIntelSection() {
  const [email, setEmail] = useState('');
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!email.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const result = await post<Record<string, any> & { error?: string }>('/email-intel', { email: email.trim() });
      if ('error' in result && result.error && !result.reputation) { setError(result.error); }
      else setData(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const repColor = (rep: string) => {
    if (rep === 'high') return 'text-primary';
    if (rep === 'medium') return 'text-yellow-500';
    if (rep === 'low' || rep === 'none') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const details = data?.details ?? {};

  return (
    <Card className="rounded-none border-2 border-primary">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-primary" /> Email Intelligence
        </CardTitle>
        <CardDescription className="text-[9px]">Reputation scoring, breach exposure & deliverability via emailrep.io</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. target@domain.co.za"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            className="rounded-none border-2 font-mono text-xs h-8 flex-1"
          />
          <Button onClick={lookup} disabled={loading} size="sm" className="rounded-none font-black h-8 px-4">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive font-mono">{error}</p>}

        {data && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {data.suspicious
                ? <ShieldAlert className="h-4 w-4 text-destructive" />
                : <ShieldCheck className="h-4 w-4 text-primary" />}
              <span className={`text-xs font-black uppercase ${repColor(data.reputation)}`}>
                Reputation: {(data.reputation ?? 'unknown').toUpperCase()}
              </span>
              {data.references !== undefined && (
                <Badge variant="outline" className="text-[8px] rounded-none font-black h-5">
                  {data.references} REFERENCES
                </Badge>
              )}
              {data.suspicious && (
                <Badge variant="destructive" className="text-[8px] rounded-none font-black h-5">SUSPICIOUS</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Blacklisted', value: details.blacklisted },
                { label: 'Malicious Activity', value: details.malicious_activity },
                { label: 'Credentials Leaked', value: details.credentials_leaked },
                { label: 'Data Breach', value: details.data_breach },
                { label: 'Spam Reported', value: details.spam },
                { label: 'Free Provider', value: details.free_provider },
                { label: 'Disposable', value: details.disposable },
                { label: 'Deliverable', value: details.deliverable },
              ].filter(r => r.value !== undefined).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-2 border bg-muted/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                  <span className={`text-[9px] font-black uppercase ${value ? 'text-destructive' : 'text-primary'}`}>
                    {value ? 'YES' : 'NO'}
                  </span>
                </div>
              ))}
            </div>

            {details.domain_reputation && details.domain_reputation !== 'unknown' && (
              <div className="p-2 border bg-muted/5 space-y-0.5">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Domain Reputation</p>
                <p className={`text-xs font-black uppercase ${repColor(details.domain_reputation)}`}>
                  {details.domain_reputation}
                </p>
              </div>
            )}

            {data._source === 'algorithmic_fallback' && (
              <p className="text-[8px] text-muted-foreground font-mono italic">
                * External service unreachable — basic algorithmic analysis
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────
export function CyberIntelPanel({ subject }: { subject: Subject }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Cpu className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest">Cyber Intelligence Gateway</span>
        <Badge variant="outline" className="text-[8px] rounded-none font-black h-5 ml-auto">FREE TIER — NO API KEY</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <IDDecodeSection idNumber={subject.idNumber} />
        <PhoneIntelSection phone={subject.phoneNumber} />
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <IPIntelSection />
        <DomainIntelSection />
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <EmailIntelSection />
      </div>
    </div>
  );
}
