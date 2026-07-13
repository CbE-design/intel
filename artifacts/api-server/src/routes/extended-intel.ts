import { Router } from 'express';
import { pool } from '../lib/db.js';
import Groq from 'groq-sdk';

const extRouter = Router();

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function groqChat(system: string, user: string): Promise<string> {
  const groq = getGroq();
  if (!groq) return '';
  const r = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_tokens: 4096,
    temperature: 0.5,
  });
  return r.choices[0]?.message?.content ?? '';
}

// ─── SOCIAL OSINT ─────────────────────────────────────────────────────────────
// POST /api/intelligence/social-osint
extRouter.post('/intelligence/social-osint', async (req, res) => {
  try {
    const { username, fullName } = req.body;
    if (!username && !fullName) { res.status(400).json({ error: 'username or fullName required' }); return; }

    const query = username || fullName;

    // Real free checks: GitHub, Wikipedia name search
    const githubRes = await fetch(`https://api.github.com/users/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Veritas-Intel/1.0' }
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then(r => r.ok ? r.json() : null).catch(() => null);

    // Groq synthesises likely platform presence
    const synthesis = await groqChat(
      'You are a social OSINT analyst. Given a username/name, assess likely platform presence and risk indicators. Respond ONLY with valid JSON.',
      `Username/name: "${query}"
GitHub found: ${githubRes ? JSON.stringify({ login: githubRes.login, name: githubRes.name, public_repos: githubRes.public_repos, followers: githubRes.followers, bio: githubRes.bio }) : 'no'}
Wikipedia found: ${wikiRes?.type === 'standard' ? wikiRes.extract?.slice(0, 300) : 'no'}

Return JSON: { "platforms": [{"name":"string","status":"FOUND|NOT_FOUND|UNKNOWN","url":"string|null","notes":"string"}], "riskIndicators": ["string"], "summary": "string", "exposureScore": 0 }`
    );

    let parsed: any = {};
    try { parsed = JSON.parse(synthesis.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()); }
    catch { parsed = { platforms: [], riskIndicators: [], summary: synthesis || 'OSINT sweep complete.', exposureScore: 0 }; }

    // Inject real data
    if (githubRes?.login) {
      const existing = parsed.platforms?.find((p: any) => p.name?.toLowerCase() === 'github');
      if (existing) { existing.status = 'FOUND'; existing.url = `https://github.com/${githubRes.login}`; }
      else parsed.platforms?.unshift({ name: 'GitHub', status: 'FOUND', url: `https://github.com/${githubRes.login}`, notes: `${githubRes.public_repos} repos, ${githubRes.followers} followers` });
    }

    res.json({ ...parsed, query });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── DARK WEB SCAN ────────────────────────────────────────────────────────────
// POST /api/intelligence/darkweb-scan
extRouter.post('/intelligence/darkweb-scan', async (req, res) => {
  try {
    const { query, type } = req.body; // type: 'email'|'name'|'id'|'phone'
    if (!query) { res.status(400).json({ error: 'query required' }); return; }

    // Real check: HaveIBeenPwned email breach (free, no key for search)
    let breachData: any[] = [];
    if (type === 'email' || query.includes('@')) {
      try {
        const r = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(query)}?truncateResponse=false`, {
          headers: { 'User-Agent': 'Veritas-Intel/1.0', 'hibp-api-key': 'none' }
        });
        if (r.status === 200) breachData = await r.json();
      } catch { /* no key, skip */ }
    }

    // Groq generates dark web threat assessment
    const assessment = await groqChat(
      'You are a dark web threat intelligence analyst for a private investigation firm. Assess dark web exposure risk. Respond ONLY with valid JSON.',
      `Query: "${query}" (type: ${type || 'unknown'})
Known breach data: ${breachData.length > 0 ? JSON.stringify(breachData.slice(0, 5).map((b: any) => ({ name: b.Name, date: b.BreachDate, data: b.DataClasses }))) : 'none found via public APIs'}

Analyse likely dark web exposure based on the query type and any known data. 
Return JSON: { "threatLevel": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "findings": [{"source":"string","type":"string","details":"string","confidence":0}], "recommendations": ["string"], "summary": "string", "darkWebScore": 0 }`
    );

    let parsed: any = {};
    try { parsed = JSON.parse(assessment.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()); }
    catch { parsed = { threatLevel: 'UNKNOWN', findings: [], recommendations: [], summary: assessment || 'Scan complete.', darkWebScore: 0 }; }

    res.json({ ...parsed, query, breachCount: breachData.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── COMPANY LOOKUP ───────────────────────────────────────────────────────────
// POST /api/intelligence/company-lookup
extRouter.post('/intelligence/company-lookup', async (req, res) => {
  try {
    const { companyName, registrationNumber } = req.body;
    if (!companyName && !registrationNumber) { res.status(400).json({ error: 'companyName or registrationNumber required' }); return; }

    const query = companyName || registrationNumber;

    // OpenCorporates free API
    let ocData: any = null;
    try {
      const ocRes = await fetch(`https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&jurisdiction_code=za&per_page=3`);
      if (ocRes.ok) {
        const ocJson = await ocRes.json();
        ocData = ocJson?.results?.companies?.[0]?.company ?? null;
      }
    } catch { /* skip */ }

    // Groq enrichment
    const enriched = await groqChat(
      'You are a corporate intelligence analyst specialising in South African companies. Generate a detailed CIPC-style company intelligence report. Respond ONLY with valid JSON.',
      `Company: "${companyName || 'Unknown'}" Registration: "${registrationNumber || 'Unknown'}"
OpenCorporates data: ${ocData ? JSON.stringify({ name: ocData.name, status: ocData.current_status, jurisdiction: ocData.jurisdiction_code, registered: ocData.incorporation_date, registered_address: ocData.registered_address_in_full }) : 'not found'}

Return JSON: { "companyName":"string", "registrationNumber":"string", "status":"Active|Dormant|Deregistered|Unknown", "incorporationDate":"string", "registeredAddress":"string", "industry":"string", "directors":[{"name":"string","id":"string","role":"string","appointed":"string"}], "riskFlags":["string"], "intelligenceSummary":"string", "riskScore":0 }`
    );

    let parsed: any = {};
    try { parsed = JSON.parse(enriched.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()); }
    catch { parsed = { companyName: query, status: 'Unknown', directors: [], riskFlags: [], intelligenceSummary: enriched || 'Lookup complete.', riskScore: 0 }; }

    // Save to DB
    await pool.query(
      `INSERT INTO company_lookups (company_name, registration_number, directors, status, incorporation_date, registered_address, industry, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [parsed.companyName || query, parsed.registrationNumber || registrationNumber || '', JSON.stringify(parsed.directors || []), parsed.status || 'Unknown', parsed.incorporationDate || '', parsed.registeredAddress || '', parsed.industry || '', JSON.stringify(parsed)]
    );

    res.json({ ...parsed, ocSource: ocData ? 'opencorporates' : null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/intelligence/company-lookup/history
extRouter.get('/intelligence/company-lookup/history', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM company_lookups ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IP GEOLOCATION FOR MAP ───────────────────────────────────────────────────
// POST /api/intelligence/ip-geolocate
extRouter.post('/intelligence/ip-geolocate', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) { res.status(400).json({ error: 'ip required' }); return; }
    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!r.ok) { res.status(502).json({ error: 'Geolocation service unavailable' }); return; }
    const data = await r.json() as any;
    if (data.error) { res.status(400).json({ error: data.reason || 'Invalid IP' }); return; }
    res.json({
      ip: data.ip, lat: data.latitude, lng: data.longitude,
      city: data.city, region: data.region, country: data.country_name,
      isp: data.org, asn: data.asn, timezone: data.timezone,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ADDRESS GEOCODE FOR MAP ──────────────────────────────────────────────────
// POST /api/intelligence/address-geolocate
extRouter.post('/intelligence/address-geolocate', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) { res.status(400).json({ error: 'address required' }); return; }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=za`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Veritas-Intel/1.0' } });
    const data = await r.json() as any[];
    if (!data?.length) { res.status(404).json({ error: 'Address not found' }); return; }
    res.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display_name: data[0].display_name });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── WATCHLIST ALERTS ─────────────────────────────────────────────────────────
// GET /api/watchlist
extRouter.get('/watchlist', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM watchlist_alerts ORDER BY triggered_at DESC LIMIT 100');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/watchlist
extRouter.post('/watchlist', async (req, res) => {
  try {
    const { subject_id, subject_name, alert_type, severity, message } = req.body;
    if (!subject_name || !message) { res.status(400).json({ error: 'subject_name and message required' }); return; }
    const { rows } = await pool.query(
      `INSERT INTO watchlist_alerts (subject_id, subject_name, alert_type, severity, message) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [subject_id || null, subject_name, alert_type || 'Manual', severity || 'Medium', message]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/watchlist/:id/read
extRouter.patch('/watchlist/:id/read', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE watchlist_alerts SET is_read=TRUE WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!rows.length) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/watchlist/:id
extRouter.delete('/watchlist/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM watchlist_alerts WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/watchlist/unread-count
extRouter.get('/watchlist/unread-count', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM watchlist_alerts WHERE is_read=FALSE');
    res.json({ count: parseInt(rows[0].count) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default extRouter;
