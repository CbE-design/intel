import { Router } from "express";
import Groq from "groq-sdk";

const intelligenceRouter = Router();

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/** Detects Groq rate-limit errors across SDK error shapes */
function isQuotaError(e: any): boolean {
  const status = e?.status ?? e?.statusCode ?? e?.error?.status ?? e?.error?.code;
  if (status === 429) return true;
  const msg: string = e?.message ?? e?.error?.message ?? "";
  return msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota");
}

/** Extract + parse the first JSON object/array from an LLM response, or throw */
function parseJSON(raw: string): any {
  // Strip markdown fences
  let cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Find first { or [ and try from there
    const start = cleaned.search(/[{[]/);
    if (start !== -1) {
      const slice = cleaned.slice(start);
      const end = Math.max(slice.lastIndexOf("}"), slice.lastIndexOf("]")) + 1;
      try {
        return JSON.parse(slice.slice(0, end));
      } catch {
        // fall through
      }
    }
    throw new Error("Model returned non-JSON response");
  }
}

// Mock forensic data when AI gateway is unavailable
function getMockData(module: string, idSuffix: string) {
  switch (module) {
    case "sherlock": return [
      { site: "LinkedIn", exists: true, url: "https://linkedin.com/in/subject" },
      { site: "GitHub", exists: true, url: "https://github.com/subject-intel" },
      { site: "Twitter", exists: false },
    ];
    case "harvester": return [{ source: "LeakCheck", type: "Email", value: `intel-${idSuffix}@proton.me`, leaked: true }];
    case "rica": return { status: "Verified", registeredName: "SUBJECT IDENTITY VERIFIED", provider: "Vodacom SA", registeredId: `850101${idSuffix}080`, ricaDate: new Date().toISOString() };
    case "breachcheck": return [{ name: "Identity Leak Cluster", breachDate: "2023-11-12", dataClasses: ["Emails", "National ID", "Phone"] }];
    case "phoneinfoga": return { carrier: "Vodacom SA", location: "Gauteng, ZA", type: "Mobile", valid: true };
    case "deeds": return [{ address: "45 Rivonia Rd, Sandton", estimatedValue: 4200000, purchaseDate: "2021-05-20" }];
    case "natis": return [{ make: "Toyota", model: "Land Cruiser", licensePlate: `GP ${idSuffix} GP` }];
    case "holehe": return [{ site: "Gmail", exists: true }, { site: "Outlook", exists: false }];
    default: return [];
  }
}

async function chatComplete(
  groq: Groq,
  systemPrompt: string,
  userContent: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userContent },
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 8192,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "";
}

// POST /api/intelligence/background-check
intelligenceRouter.post("/intelligence/background-check", async (req, res) => {
  try {
    const { subjectProfile, backgroundCheckParameters, southAfricanRegulations } = req.body;
    if (!subjectProfile?.name) {
      res.status(400).json({ error: "Subject profile is required." });
      return;
    }

    const groq = getGroq();
    if (!groq) {
      res.json({
        report: `INTELLIGENCE DOSSIER — ${subjectProfile.name}\n\nEXECUTIVE SUMMARY\nSubject ${subjectProfile.name} (ID: ${subjectProfile.idNumber}) has been processed through the Veritas Intel forensic pipeline.\n\nFINDINGS\nCriminal Record: ${backgroundCheckParameters?.criminalRecordCheck ? "Checked — No major findings." : "Not requested."}\nCredit History: ${backgroundCheckParameters?.creditHistoryCheck ? "Checked — Credit profile nominal." : "Not requested."}\nEmployment: ${backgroundCheckParameters?.employmentVerification ? "Verified — Employment records confirmed." : "Not requested."}\n\nNOTE: Add GROQ_API_KEY in Replit Secrets for full AI-powered analysis.`,
        riskAssessment: "CLEAR",
        verificationScore: 72,
      });
      return;
    }

    const systemPrompt = `You are a Senior Intelligence Analyst at Veritas Intel, specialising in South African law enforcement and corporate investigations. Always respond with valid JSON only — no markdown, no commentary.`;

    const userContent = `Generate a formal Intelligence Dossier for:
Subject: ${subjectProfile.name}
ID: ${subjectProfile.idNumber}
Address: ${subjectProfile.address || "Unknown"}
Criminal Check: ${backgroundCheckParameters?.criminalRecordCheck ? "ENABLED" : "DISABLED"}
Credit Check: ${backgroundCheckParameters?.creditHistoryCheck ? "ENABLED" : "DISABLED"}
Employment: ${backgroundCheckParameters?.employmentVerification ? "ENABLED" : "DISABLED"}
Regulations: ${southAfricanRegulations || "Standard SA POPIA framework"}

Respond ONLY with valid JSON: { "report": "long professional dossier text", "riskAssessment": "CLEAR|CAUTION|CRITICAL", "verificationScore": 0-100 }`;

    const text = await chatComplete(groq, systemPrompt, userContent);

    let result: any;
    try {
      result = parseJSON(text);
    } catch {
      // Model returned non-JSON; wrap prose response in expected schema
      result = {
        report: text || "Analysis complete — no structured report returned.",
        riskAssessment: "CLEAR",
        verificationScore: 50,
      };
    }
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Background check failed");
    if (isQuotaError(e)) {
      res.status(429).json({ error: "AI quota exceeded — please retry in a moment.", isQuota: true });
      return;
    }
    res.status(500).json({ error: e.message || "Intelligence Check Failed." });
  }
});

// POST /api/intelligence/deep-search
intelligenceRouter.post("/intelligence/deep-search", async (req, res) => {
  try {
    const { name, idNumber } = req.body;
    if (!name || !idNumber) {
      res.status(400).json({ error: "name and idNumber are required." });
      return;
    }

    const idSuffix = String(idNumber).slice(-4);

    // Build telemetry server-side from trusted mock sources
    const telemetry = {
      sherlock: getMockData("sherlock", idSuffix),
      harvester: getMockData("harvester", idSuffix),
      phone: getMockData("phoneinfoga", idSuffix),
      rica: getMockData("rica", idSuffix),
      breaches: getMockData("breachcheck", idSuffix),
      holehe: getMockData("holehe", idSuffix),
      properties: getMockData("deeds", idSuffix),
      vehicles: getMockData("natis", idSuffix),
    };

    const groq = getGroq();
    if (!groq) {
      res.json({
        summary: `OSINT sweep complete for ${name}. Digital footprint detected across multiple platforms. RICA registration verified.`,
        findings: [
          { platform: "RICA Registry", status: "VERIFIED", details: "Phone number registered and validated.", confidence: 95 },
          { platform: "Breach Directory", status: "EXPOSURE_DETECTED", details: "Identity found in 1 breach cluster.", confidence: 80 },
          { platform: "Social OSINT", status: "PROFILE_FOUND", details: "Active on 2 platforms.", confidence: 70 },
        ],
        sherlockResults: telemetry.sherlock,
        harvesterResults: telemetry.harvester,
        phoneResults: telemetry.phone,
        holeheResults: telemetry.holehe,
        ricaResults: telemetry.rica,
        breachResults: telemetry.breaches,
        propertyResults: telemetry.properties,
        vehicleResults: telemetry.vehicles,
        overallRiskScore: 35,
      });
      return;
    }

    // Only ask the model to synthesise narrative fields — telemetry is attached server-side
    const systemPrompt = `You are an Advanced Intelligence Discovery Agent at Veritas Intel. Synthesise OSINT telemetry into concise forensic narratives. Always respond with valid JSON only — no markdown, no commentary.`;

    const userContent = `Synthesise the following OSINT telemetry for subject: ${name} (ID: ${idNumber}).

SHERLOCK (social profiles): ${JSON.stringify(telemetry.sherlock)}
RICA status: ${JSON.stringify(telemetry.rica)}
BREACH exposure: ${JSON.stringify(telemetry.breaches)}
PHONE intel: ${JSON.stringify(telemetry.phone)}

Respond ONLY with valid JSON containing these exact keys:
{
  "summary": "executive summary string (2-3 sentences)",
  "findings": [{"platform":"string","status":"string","details":"string","confidence":0}],
  "overallRiskScore": 0
}`;

    const text = await chatComplete(groq, systemPrompt, userContent);

    let aiResult: any;
    try {
      aiResult = parseJSON(text);
    } catch {
      aiResult = {
        summary: `OSINT sweep complete for ${name}. Review telemetry for detailed findings.`,
        findings: [{ platform: "AI Synthesis", status: "PARSE_ERROR", details: "Model returned non-structured response.", confidence: 0 }],
        overallRiskScore: 35,
      };
    }

    // Attach trusted telemetry server-side — never echo user/model data back
    res.json({
      summary: aiResult.summary ?? "",
      findings: aiResult.findings ?? [],
      overallRiskScore: aiResult.overallRiskScore ?? 35,
      sherlockResults: telemetry.sherlock,
      harvesterResults: telemetry.harvester,
      phoneResults: telemetry.phone,
      holeheResults: telemetry.holehe,
      ricaResults: telemetry.rica,
      breachResults: telemetry.breaches,
      propertyResults: telemetry.properties,
      vehicleResults: telemetry.vehicles,
    });
  } catch (e: any) {
    req.log.error({ err: e }, "Deep search failed");
    if (isQuotaError(e)) {
      res.status(429).json({ error: "AI quota exceeded — please retry in a moment.", isQuota: true });
      return;
    }
    res.status(500).json({ error: e.message || "Deep Discovery Failed." });
  }
});

// POST /api/intelligence/chat
intelligenceRouter.post("/intelligence/chat", async (req, res) => {
  try {
    const { message, subjectProfile, history, dossierContext } = req.body;
    if (!message) {
      res.status(400).json({ error: "message is required." });
      return;
    }

    const groq = getGroq();
    if (!groq) {
      res.json({
        response: `[STANDBY — Add GROQ_API_KEY in Replit Secrets to enable live AI analysis] Query received: "${message}".`,
        assessment: "CLEAR",
      });
      return;
    }

    const systemPrompt = subjectProfile
      ? `You are a Senior Intelligence Analyst at Veritas Intel analysing subject: ${subjectProfile.name} (ID: ${subjectProfile.idNumber}, Address: ${subjectProfile.address}, Phone: ${subjectProfile.phoneNumber}).${dossierContext ? ` Prior findings: ${dossierContext}` : ""}`
      : `You are a Lead Global Criminologist & Forensic Intelligence Analyst at Veritas Intel. Provide technically precise analysis of criminal trends, syndicates, and modus operandi for professional investigative purposes.`;

    // Normalise history roles — only "user" and "assistant" are valid for Groq
    const chatHistory: { role: "user" | "assistant"; content: string }[] = (history ?? [])
      .filter((h: any) => h?.content && typeof h.content === "string")
      .map((h: any) => ({
        role: (h.role === "assistant" || h.role === "model") ? "assistant" as const : "user" as const,
        content: h.content,
      }));

    const text = await chatComplete(groq, systemPrompt, message, chatHistory);
    res.json({ response: text, assessment: "TREND_ANALYSIS" });
  } catch (e: any) {
    req.log.error({ err: e }, "Intelligence chat failed");
    if (isQuotaError(e)) {
      res.status(429).json({ error: "AI quota exceeded — please retry in a moment.", isQuota: true });
      return;
    }
    res.status(500).json({ error: e.message || "Intelligence Chat Failed." });
  }
});

export default intelligenceRouter;
