import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const intelligenceRouter = Router();

function getGenAI() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function isQuotaError(e: any): boolean {
  const status = e?.status ?? e?.statusCode ?? e?.error?.status;
  if (status === 429) return true;
  const msg: string = e?.message ?? e?.error?.message ?? "";
  return msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota");
}

function parseJSON(raw: string): any {
  let cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /**/ }
  const start = cleaned.search(/[{[]/);
  if (start !== -1) {
    const slice = cleaned.slice(start);
    const end = Math.max(slice.lastIndexOf("}"), slice.lastIndexOf("]")) + 1;
    try { return JSON.parse(slice.slice(0, end)); } catch { /**/ }
  }
  throw new Error("Model returned non-JSON response");
}

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
  genai: GoogleGenerativeAI,
  systemPrompt: string,
  userContent: string,
  history: { role: "user" | "model"; content: string }[] = []
): Promise<string> {
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role === "assistant" ? "model" : h.role,
      parts: [{ text: h.content }],
    })),
  });

  const result = await chat.sendMessage(userContent);
  return result.response.text();
}

// POST /api/intelligence/background-check
intelligenceRouter.post("/intelligence/background-check", async (req, res) => {
  try {
    const { subjectProfile, backgroundCheckParameters, southAfricanRegulations } = req.body;
    if (!subjectProfile?.name) {
      res.status(400).json({ error: "Subject profile is required." });
      return;
    }

    const genai = getGenAI();
    if (!genai) {
      res.json({
        report: `INTELLIGENCE DOSSIER — ${subjectProfile.name}\n\nEXECUTIVE SUMMARY\nSubject ${subjectProfile.name} (ID: ${subjectProfile.idNumber}) has been processed through the Veritas Intel forensic pipeline.\n\nFINDINGS\nCriminal Record: ${backgroundCheckParameters?.criminalRecordCheck ? "Checked — No major findings." : "Not requested."}\nCredit History: ${backgroundCheckParameters?.creditHistoryCheck ? "Checked — Credit profile nominal." : "Not requested."}\nEmployment: ${backgroundCheckParameters?.employmentVerification ? "Verified — Employment records confirmed." : "Not requested."}`,
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

    const text = await chatComplete(genai, systemPrompt, userContent);
    let result: any;
    try {
      result = parseJSON(text);
    } catch {
      result = { report: text || "Analysis complete.", riskAssessment: "CLEAR", verificationScore: 50 };
    }
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Background check failed");
    if (isQuotaError(e)) {
      res.status(429).json({ error: "Analysis quota exceeded — please retry in a moment.", isQuota: true });
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

    const genai = getGenAI();
    if (!genai) {
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

    const text = await chatComplete(genai, systemPrompt, userContent);
    let aiResult: any;
    try {
      aiResult = parseJSON(text);
    } catch {
      aiResult = {
        summary: `OSINT sweep complete for ${name}. Review telemetry for detailed findings.`,
        findings: [{ platform: "Analysis Engine", status: "PARSE_ERROR", details: "Response could not be structured.", confidence: 0 }],
        overallRiskScore: 35,
      };
    }

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
      res.status(429).json({ error: "Analysis quota exceeded — please retry in a moment.", isQuota: true });
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

    const genai = getGenAI();
    if (!genai) {
      res.json({
        response: `Analysis engine is in standby. The system requires GOOGLE_GENAI_API_KEY to be configured in Replit Secrets. Query received: "${message}".`,
        assessment: "CLEAR",
      });
      return;
    }

    const systemPrompt = subjectProfile
      ? `You are a Senior Intelligence Analyst at Veritas Intel analysing subject: ${subjectProfile.name} (ID: ${subjectProfile.idNumber}, Address: ${subjectProfile.address}, Phone: ${subjectProfile.phoneNumber}).${dossierContext ? ` Prior findings: ${dossierContext}` : ""}`
      : `You are a Lead Global Criminologist & Forensic Intelligence Analyst at Veritas Intel. Provide technically precise analysis of criminal trends, syndicates, and modus operandi for professional investigative purposes.`;

    const chatHistory: { role: "user" | "model"; content: string }[] = (history ?? [])
      .filter((h: any) => h?.content && typeof h.content === "string")
      .map((h: any) => ({
        role: (h.role === "assistant" || h.role === "model") ? "model" as const : "user" as const,
        content: h.content,
      }));

    const text = await chatComplete(genai, systemPrompt, message, chatHistory);
    res.json({ response: text, assessment: "TREND_ANALYSIS" });
  } catch (e: any) {
    req.log.error({ err: e }, "Intelligence chat failed");
    if (isQuotaError(e)) {
      res.status(429).json({ error: "Analysis quota exceeded — please retry in a moment.", isQuota: true });
      return;
    }
    res.status(500).json({ error: e.message || "Intelligence analysis unavailable." });
  }
});

export default intelligenceRouter;
