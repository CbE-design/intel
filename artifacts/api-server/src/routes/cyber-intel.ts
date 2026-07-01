import { Router } from "express";
import { parsePhoneNumber } from "libphonenumber-js";
import dns from "node:dns/promises";

const cyberRouter = Router();

// ─── SA ID Decoder ─────────────────────────────────────────────────────────
// Pure Luhn algorithm — no API, no key, zero cost.
cyberRouter.post("/intelligence/sa-id-decode", (req, res) => {
  const { idNumber } = req.body;
  const id = String(idNumber || "").trim();

  if (!/^\d{13}$/.test(id)) {
    res.status(400).json({ error: "Valid 13-digit SA ID required." });
    return;
  }

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = parseInt(id.charAt(i));
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  if (sum % 10 !== 0) {
    res.json({ isValid: false, error: "Luhn checksum failed — ID may be fraudulent." });
    return;
  }

  const yy = id.substring(0, 2);
  const mm = id.substring(2, 4);
  const dd = id.substring(4, 6);
  const genderCode = parseInt(id.substring(6, 10));
  const citizenCode = parseInt(id.substring(10, 11));
  const currentYearShort = new Date().getFullYear() % 100;
  const birthYear = parseInt(yy) > currentYearShort ? `19${yy}` : `20${yy}`;
  const dob = `${birthYear}-${mm}-${dd}`;
  const today = new Date();
  const born = new Date(dob);
  const age = today.getFullYear() - born.getFullYear() -
    (today < new Date(today.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);

  res.json({
    isValid: true,
    dob,
    age,
    gender: genderCode >= 5000 ? "Male" : "Female",
    citizenship: citizenCode === 0 ? "SA Citizen" : "Permanent Resident",
    genderSequence: id.substring(6, 10),
    controlDigit: id.charAt(12),
  });
});

// ─── Phone Intelligence ─────────────────────────────────────────────────────
// libphonenumber-js — free library, zero network calls.
cyberRouter.post("/intelligence/phone-validate", (req, res) => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ error: "Phone number required." }); return; }

  try {
    const parsed = parsePhoneNumber(String(phone), "ZA");
    const typeMap: Record<string, string> = {
      MOBILE: "Mobile",
      FIXED_LINE: "Fixed Line",
      FIXED_LINE_OR_MOBILE: "Fixed/Mobile",
      TOLL_FREE: "Toll-Free",
      PREMIUM_RATE: "Premium Rate",
      VOIP: "VoIP",
      PAGER: "Pager",
      PERSONAL_NUMBER: "Personal Number",
      UAN: "UAN",
      UNKNOWN: "Unknown",
    };
    const rawType = parsed.getType() ?? "UNKNOWN";
    res.json({
      isValid: parsed.isValid(),
      isPossible: parsed.isPossible(),
      national: parsed.formatNational(),
      international: parsed.formatInternational(),
      uri: parsed.getURI(),
      country: parsed.country ?? "Unknown",
      countryCallingCode: `+${parsed.countryCallingCode}`,
      nationalNumber: parsed.nationalNumber,
      lineType: typeMap[rawType] ?? rawType,
    });
  } catch (e: any) {
    res.json({ isValid: false, error: `Parse error: ${e.message}` });
  }
});

// ─── IP Intelligence ────────────────────────────────────────────────────────
// ip-api.com (free, no key, 45 req/min) + Shodan InternetDB (free, no key).
cyberRouter.post("/intelligence/ip-lookup", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(String(ip))) {
    res.status(400).json({ error: "Valid IPv4 address required." });
    return;
  }

  try {
    const fields = "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting";
    const [geoRes, shodanRes] = await Promise.allSettled([
      fetch(`http://ip-api.com/json/${ip}?fields=${fields}`),
      fetch(`https://internetdb.shodan.io/${ip}`),
    ]);

    let geo: Record<string, any> = {};
    let shodan: Record<string, any> = {};

    if (geoRes.status === "fulfilled" && geoRes.value.ok) {
      geo = await geoRes.value.json() as Record<string, any>;
    }
    if (shodanRes.status === "fulfilled" && shodanRes.value.ok) {
      shodan = await shodanRes.value.json() as Record<string, any>;
    }

    res.json({
      ip: geo.query ?? ip,
      country: geo.country ?? "Unknown",
      countryCode: geo.countryCode ?? "",
      region: geo.regionName ?? "",
      city: geo.city ?? "",
      isp: geo.isp ?? "",
      org: geo.org ?? "",
      asn: geo.as ?? "",
      timezone: geo.timezone ?? "",
      lat: geo.lat ?? 0,
      lon: geo.lon ?? 0,
      isMobile: geo.mobile ?? false,
      isProxy: geo.proxy ?? false,
      isHosting: geo.hosting ?? false,
      ports: shodan.ports ?? [],
      vulns: shodan.vulns ?? [],
      tags: shodan.tags ?? [],
      hostnames: shodan.hostnames ?? [],
      cpes: shodan.cpes ?? [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Domain Intelligence ────────────────────────────────────────────────────
// Node.js built-in dns module + crt.sh certificate transparency log (free, no key).
cyberRouter.post("/intelligence/domain-intel", async (req, res) => {
  const { domain } = req.body;
  const d = String(domain || "").trim().replace(/^https?:\/\//i, "").split("/")[0];

  if (!d || !/^[\w.-]+\.[a-z]{2,}$/i.test(d)) {
    res.status(400).json({ error: "Valid domain (e.g. example.com) required." });
    return;
  }

  const [aRes, mxRes, nsRes, txtRes, certRes] = await Promise.allSettled([
    dns.resolve4(d),
    dns.resolveMx(d),
    dns.resolveNs(d),
    dns.resolveTxt(d),
    fetch(`https://crt.sh/?q=%.${d}&output=json`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  let certificates: any[] = [];
  if (certRes.status === "fulfilled" && certRes.value.ok) {
    try {
      const raw: any[] = await certRes.value.json();
      const seen = new Set<string>();
      certificates = raw
        .filter((c) => !seen.has(c.common_name) && seen.add(c.common_name))
        .slice(0, 25)
        .map((c) => ({
          id: c.id,
          commonName: c.common_name,
          issuer: c.issuer_name?.replace(/^CN=/i, "").split(",")[0] ?? "",
          notBefore: c.not_before,
          notAfter: c.not_after,
          loggedAt: c.entry_timestamp,
        }));
    } catch { /* ignore parse errors */ }
  }

  res.json({
    domain: d,
    aRecords: aRes.status === "fulfilled" ? aRes.value : [],
    mxRecords: mxRes.status === "fulfilled"
      ? mxRes.value.map((r) => `${r.priority} ${r.exchange}`)
      : [],
    nsRecords: nsRes.status === "fulfilled" ? nsRes.value : [],
    txtRecords: txtRes.status === "fulfilled"
      ? txtRes.value.map((r) => r.join(""))
      : [],
    certificates,
  });
});

export default cyberRouter;
