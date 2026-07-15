import { Router } from 'express';
import Groq from 'groq-sdk';

const phoneRouter = Router();

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// ── SA carrier prefix table (built-in, always free, always accurate) ──────────
interface CarrierInfo {
  network: string;
  type: 'mobile' | 'landline' | 'voip' | 'tollfree' | 'premium' | 'unknown';
  color: string;
}

const SA_PREFIXES: Record<string, CarrierInfo> = {
  // Telkom Mobile (formerly 8ta)
  '060': { network: 'Telkom Mobile', type: 'mobile', color: '#E8173A' },
  '061': { network: 'Telkom Mobile', type: 'mobile', color: '#E8173A' },
  '062': { network: 'Telkom Mobile', type: 'mobile', color: '#E8173A' },
  '067': { network: 'Telkom Mobile', type: 'mobile', color: '#E8173A' },
  '068': { network: 'Telkom Mobile', type: 'mobile', color: '#E8173A' },
  // MTN
  '063': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '064': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '065': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '066': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '073': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '081': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  '082': { network: 'MTN', type: 'mobile', color: '#FFCB03' },
  // Vodacom
  '071': { network: 'Vodacom', type: 'mobile', color: '#E60000' },
  '072': { network: 'Vodacom', type: 'mobile', color: '#E60000' },
  '079': { network: 'Vodacom', type: 'mobile', color: '#E60000' },
  '083': { network: 'Vodacom', type: 'mobile', color: '#E60000' },
  // Cell C
  '069': { network: 'Cell C', type: 'mobile', color: '#00A651' },
  '074': { network: 'Cell C', type: 'mobile', color: '#00A651' },
  '076': { network: 'Cell C', type: 'mobile', color: '#00A651' },
  '078': { network: 'Cell C / MVNO', type: 'mobile', color: '#00A651' },
  '084': { network: 'Cell C', type: 'mobile', color: '#00A651' },
  '085': { network: 'Cell C', type: 'mobile', color: '#00A651' },
  // VoIP / shared
  '087': { network: 'VoIP (various providers)', type: 'voip', color: '#6366F1' },
  '086': { network: 'Shared Voice Services', type: 'voip', color: '#6366F1' },
  // Landline regions (area codes)
  '010': { network: 'Telkom Landline (Johannesburg/Gauteng)', type: 'landline', color: '#94A3B8' },
  '011': { network: 'Telkom Landline (Johannesburg/Gauteng)', type: 'landline', color: '#94A3B8' },
  '012': { network: 'Telkom Landline (Pretoria/Tshwane)', type: 'landline', color: '#94A3B8' },
  '013': { network: 'Telkom Landline (Mpumalanga)', type: 'landline', color: '#94A3B8' },
  '014': { network: 'Telkom Landline (North West)', type: 'landline', color: '#94A3B8' },
  '015': { network: 'Telkom Landline (Limpopo)', type: 'landline', color: '#94A3B8' },
  '016': { network: 'Telkom Landline (Southern Gauteng/Vaal)', type: 'landline', color: '#94A3B8' },
  '017': { network: 'Telkom Landline (Mpumalanga/Gert Sibande)', type: 'landline', color: '#94A3B8' },
  '018': { network: 'Telkom Landline (North West)', type: 'landline', color: '#94A3B8' },
  '021': { network: 'Telkom Landline (Cape Town/Western Cape)', type: 'landline', color: '#94A3B8' },
  '022': { network: 'Telkom Landline (West Coast WC)', type: 'landline', color: '#94A3B8' },
  '023': { network: 'Telkom Landline (Winelands/Overberg WC)', type: 'landline', color: '#94A3B8' },
  '024': { network: 'Telkom Landline (Swartland/Saldanha WC)', type: 'landline', color: '#94A3B8' },
  '027': { network: 'Telkom Landline (Northern Cape West)', type: 'landline', color: '#94A3B8' },
  '028': { network: 'Telkom Landline (Overberg/Garden Route WC)', type: 'landline', color: '#94A3B8' },
  '031': { network: 'Telkom Landline (Durban/eThekwini KZN)', type: 'landline', color: '#94A3B8' },
  '032': { network: 'Telkom Landline (Ilembe District KZN)', type: 'landline', color: '#94A3B8' },
  '033': { network: 'Telkom Landline (Pietermaritzburg KZN)', type: 'landline', color: '#94A3B8' },
  '034': { network: 'Telkom Landline (Northern KZN)', type: 'landline', color: '#94A3B8' },
  '035': { network: 'Telkom Landline (Zululand District KZN)', type: 'landline', color: '#94A3B8' },
  '036': { network: 'Telkom Landline (Ladysmith/Battlefields KZN)', type: 'landline', color: '#94A3B8' },
  '039': { network: 'Telkom Landline (South Coast KZN)', type: 'landline', color: '#94A3B8' },
  '040': { network: 'Telkom Landline (East London/Buffalo City EC)', type: 'landline', color: '#94A3B8' },
  '041': { network: 'Telkom Landline (Port Elizabeth/Gqeberha EC)', type: 'landline', color: '#94A3B8' },
  '042': { network: 'Telkom Landline (Cacadu EC)', type: 'landline', color: '#94A3B8' },
  '043': { network: 'Telkom Landline (East London EC)', type: 'landline', color: '#94A3B8' },
  '044': { network: 'Telkom Landline (George/Garden Route WC)', type: 'landline', color: '#94A3B8' },
  '045': { network: 'Telkom Landline (Eastern Cape highlands)', type: 'landline', color: '#94A3B8' },
  '046': { network: 'Telkom Landline (Grahamstown EC)', type: 'landline', color: '#94A3B8' },
  '047': { network: 'Telkom Landline (OR Tambo District EC)', type: 'landline', color: '#94A3B8' },
  '048': { network: 'Telkom Landline (Northern Cape/Midlands)', type: 'landline', color: '#94A3B8' },
  '049': { network: 'Telkom Landline (Karoo EC)', type: 'landline', color: '#94A3B8' },
  '051': { network: 'Telkom Landline (Bloemfontein/Free State)', type: 'landline', color: '#94A3B8' },
  '053': { network: 'Telkom Landline (Northern Cape)', type: 'landline', color: '#94A3B8' },
  '054': { network: 'Telkom Landline (Northern Cape West)', type: 'landline', color: '#94A3B8' },
  '056': { network: 'Telkom Landline (Free State North)', type: 'landline', color: '#94A3B8' },
  '057': { network: 'Telkom Landline (Free State)', type: 'landline', color: '#94A3B8' },
  '058': { network: 'Telkom Landline (Free State East)', type: 'landline', color: '#94A3B8' },
  // Toll-free
  '080': { network: 'Toll-Free (various)', type: 'tollfree', color: '#22D3EE' },
};

function parseAndIdentifySANumber(raw: string): {
  formatted: string;
  e164: string;
  prefix3: string;
  prefix2: string;
  carrier: CarrierInfo | null;
  valid: boolean;
  validationNote: string;
} {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');

  let local = digits;
  // Handle +27 or 0027
  if (digits.startsWith('27') && digits.length === 11) local = '0' + digits.slice(2);
  else if (digits.startsWith('0027') && digits.length === 13) local = '0' + digits.slice(4);

  const prefix3 = local.slice(0, 3);
  const prefix2 = local.slice(0, 2);

  const carrier = SA_PREFIXES[prefix3] ?? null;

  // Validate SA number length
  let valid = false;
  let validationNote = '';

  if (local.length === 10 && local.startsWith('0')) {
    valid = true;
    validationNote = 'Valid SA format (10 digits, leading 0)';
  } else if (local.length === 9 && !local.startsWith('0')) {
    local = '0' + local;
    valid = true;
    validationNote = 'Valid SA format (9 digits, prepended 0)';
  } else if (local.length !== 10) {
    validationNote = `Invalid length: ${local.length} digits (SA numbers are 10 digits with leading 0)`;
  } else {
    validationNote = 'Format does not match standard SA number pattern';
  }

  const e164 = valid ? '+27' + local.slice(1) : '';
  const formatted = valid ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : raw;

  return { formatted, e164, prefix3, prefix2, carrier, valid, validationNote };
}

// POST /api/phone/lookup
phoneRouter.post('/phone/lookup', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number || typeof number !== 'string') {
      res.status(400).json({ error: 'number required' });
      return;
    }

    const parsed = parseAndIdentifySANumber(number.trim());
    const results: any = {
      input: number,
      formatted: parsed.formatted,
      e164: parsed.e164,
      valid: parsed.valid,
      validationNote: parsed.validationNote,
      carrier: parsed.carrier,
      prefix: parsed.prefix3,
      sources: [],
      osintFindings: [],
      ricaNote: null,
      timestamp: new Date().toISOString(),
    };

    if (!parsed.valid) {
      results.ricaNote = 'Number format invalid — cannot proceed with lookups.';
      res.json(results);
      return;
    }

    results.sources.push('SA Prefix Database (built-in)');

    // ── Abstract API phone validation (free tier: 500/month) ─────────────────
    try {
      const abstractRes = await fetch(
        `https://phonevalidation.abstractapi.com/v1/?api_key=free&phone=${encodeURIComponent(parsed.e164)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (abstractRes.ok) {
        const abstractData = await abstractRes.json() as any;
        if (abstractData?.valid !== undefined && !abstractData?.error) {
          results.abstractValidation = {
            valid: abstractData.valid,
            format: abstractData.format,
            country: abstractData.country,
            type: abstractData.type,
            carrier: abstractData.carrier,
            lineType: abstractData.line_type,
          };
          results.sources.push('Abstract API (phone validation)');
        }
      }
    } catch { /* skip — no API key or rate limited */ }

    // ── Public OSINT: DuckDuckGo search for number ────────────────────────────
    const searchVariants = [
      parsed.formatted,
      parsed.e164,
      parsed.formatted.replace(/\s/g, ''),
    ];

    for (const variant of searchVariants.slice(0, 2)) {
      try {
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(variant)}&format=json&no_redirect=1&no_html=1`,
          { headers: { 'User-Agent': 'Veritas-Intel/1.0' }, signal: AbortSignal.timeout(5000) }
        );
        if (ddgRes.ok) {
          const ddg = await ddgRes.json() as any;
          if (ddg?.AbstractText) {
            results.osintFindings.push({
              source: 'DuckDuckGo Knowledge',
              type: 'Public mention',
              value: ddg.AbstractText.slice(0, 400),
              url: ddg.AbstractURL || null,
              confidence: 'HIGH',
            });
          }
          if (ddg?.RelatedTopics?.length > 0) {
            const topics = ddg.RelatedTopics
              .filter((t: any) => t.Text && t.FirstURL)
              .slice(0, 3);
            topics.forEach((t: any) => {
              results.osintFindings.push({
                source: 'DuckDuckGo Related',
                type: 'Public mention',
                value: t.Text.slice(0, 200),
                url: t.FirstURL,
                confidence: 'MEDIUM',
              });
            });
          }
        }
      } catch { /* skip */ }
      break; // one search is enough
    }

    if (results.osintFindings.length > 0) {
      results.sources.push('DuckDuckGo Public Search');
    }

    // ── Numverify free (limited but real) ─────────────────────────────────────
    // No API key needed for basic format check via numverify free endpoint
    // Skipping as it requires an API key even for free tier

    // ── RICA legal route guidance ─────────────────────────────────────────────
    results.ricaNote = {
      title: 'RICA Subscriber Data — Legal Process Required',
      summary: 'RICA subscriber information (registered name, ID number, address linked to this number) is not publicly accessible. It is held exclusively by the mobile network operator.',
      legalRoute: [
        `1. Draft an affidavit setting out your investigation mandate and why the subscriber information is required`,
        `2. Apply to a Magistrate or High Court for a Section 205 Criminal Procedure Act (CPA) subpoena`,
        `3. Serve the Section 205 subpoena on ${parsed.carrier?.network ?? 'the relevant network operator'} — ${getCarrierFraudUnit(parsed.carrier?.network ?? '')}`,
        `4. The operator must respond within the timeframe specified by the court (typically 7–14 business days)`,
        `5. RICA data returned will include: registered name, ID number, physical address used at RICA registration, and potentially SIM card history`,
      ],
      operatorContacts: getCarrierFraudContact(parsed.carrier?.network ?? ''),
      alternativeIntelligence: [
        'Truecaller app — crowd-sourced name database, check manually',
        'WhatsApp profile — check if number has a public profile photo/status/name',
        'Telegram — search +27XXXXXXXXX to find linked accounts',
        'Facebook — search by phone number in People search (may be restricted)',
        'Google search — paste number with and without country code',
        'Call the number — identify voicemail greeting or answering message',
        'Missed call OSINT — call and hang up immediately; observe return-call behaviour',
      ],
    };

    // ── AI intelligence synthesis ─────────────────────────────────────────────
    const groq = getGroq();
    if (groq && parsed.carrier) {
      try {
        const synthesis = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a South African mobile network intelligence analyst. Provide factual, concise intelligence about what can be determined from this phone number based on the verified data provided. Do not invent subscriber data. Respond only with valid JSON.',
            },
            {
              role: 'user',
              content: `SA Phone number: ${parsed.formatted} (${parsed.e164})
Network: ${parsed.carrier.network}
Type: ${parsed.carrier.type}
Prefix: ${parsed.prefix3}
OSINT findings: ${results.osintFindings.length > 0 ? JSON.stringify(results.osintFindings.slice(0, 2)) : 'none from public sources'}

Based ONLY on this factual data, provide:
JSON: { 
  "networkAssessment": "string — what this carrier/prefix tells us operationally", 
  "simSwapRisk": "LOW|MEDIUM|HIGH — based on carrier's known fraud rates",
  "simSwapRiskReason": "string",
  "investigationTips": ["string — specific actionable tips for investigating this number, max 5"],
  "fraudPatterns": ["string — known fraud patterns associated with this carrier/prefix, if any"]
}`,
            },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        });
        const raw = synthesis.choices[0]?.message?.content ?? '';
        try {
          results.aiAssessment = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        } catch { /* skip */ }
      } catch { /* skip */ }
    }

    res.json(results);
  } catch (e: any) {
    req.log?.error({ err: e }, 'Phone lookup failed');
    res.status(500).json({ error: e.message || 'Phone lookup failed' });
  }
});

function getCarrierFraudUnit(network: string): string {
  const map: Record<string, string> = {
    'Vodacom': 'Vodacom Law Enforcement Unit (LEU): +27 82 135 / lawenforcement@vodacom.co.za',
    'MTN': 'MTN Law Enforcement Unit: +27 83 135 / leu@mtn.com',
    'Cell C': 'Cell C Law Enforcement: +27 84 140 / lawenforcement@cellc.co.za',
    'Telkom Mobile': 'Telkom Law Enforcement Unit: +27 10 213 0123 / leu@telkom.co.za',
  };
  for (const [key, val] of Object.entries(map)) {
    if (network.includes(key)) return val;
  }
  return 'Contact the relevant network operator\'s Law Enforcement Unit (LEU) directly';
}

function getCarrierFraudContact(network: string): {
  network: string;
  fraudLine: string;
  leuEmail: string;
  subpoenaProcess: string;
} {
  const contacts: Record<string, any> = {
    'Vodacom': {
      network: 'Vodacom',
      fraudLine: '082 135',
      leuEmail: 'lawenforcement@vodacom.co.za',
      subpoenaProcess: 'Serve Section 205 subpoena at: Vodacom LEU, 082 Vodacom Drive, Midrand, 1685',
    },
    'MTN': {
      network: 'MTN',
      fraudLine: '083 135',
      leuEmail: 'leu@mtn.com',
      subpoenaProcess: 'Serve Section 205 subpoena at: MTN Law Enforcement, 216 14th Avenue, Fairland, 2195',
    },
    'Cell C': {
      network: 'Cell C',
      fraudLine: '084 140',
      leuEmail: 'lawenforcement@cellc.co.za',
      subpoenaProcess: 'Serve Section 205 subpoena at: Cell C Law Enforcement, The Waterfall Campus, Bekker Road, Midrand',
    },
    'Telkom Mobile': {
      network: 'Telkom Mobile',
      fraudLine: '10213',
      leuEmail: 'leu@telkom.co.za',
      subpoenaProcess: 'Serve Section 205 subpoena at: Telkom Law Enforcement, 61 St Andrews Ave, Halfway House, Midrand',
    },
  };

  for (const [key, val] of Object.entries(contacts)) {
    if (network.includes(key)) return val;
  }

  return {
    network: network || 'Unknown',
    fraudLine: 'Contact operator directly',
    leuEmail: 'Contact operator LEU',
    subpoenaProcess: 'Identify the operator via the prefix and serve Section 205 at their registered address',
  };
}

export default phoneRouter;
