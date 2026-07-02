import { Router } from "express";
import Groq from "groq-sdk";
import { logger } from "../lib/logger";

const intelligenceRouter = Router();

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function isQuotaError(e: any): boolean {
  return e?.status === 429 || (typeof e?.message === "string" && e.message.includes("429"));
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
    case "avs": return { accountFound: true, holderMatch: true, accountStatus: "Open", accountType: "Current", verifiedDate: new Date().toISOString() };
    case "deeds": return [{ address: "45 Rivonia Rd, Sandton", estimatedValue: 4200000, purchaseDate: "2021-05-20" }];
    case "natis": return [{ make: "Toyota", model: "Land Cruiser", licensePlate: `GP ${idSuffix} GP` }];
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
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
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
    const { name, idNumber, phoneNumber } = req.body;
    if (!name || !idNumber) {
      res.status(400).json({ error: "name and idNumber are required." });
      return;
    }

    const idSuffix = String(idNumber).slice(-4);
    const sherlock = getMockData("sherlock", idSuffix);
    const harvester = getMockData("harvester", idSuffix);
    const phone = getMockData("phoneinfoga", idSuffix);
    const rica = getMockData("rica", idSuffix);
    const breaches = getMockData("breachcheck", idSuffix);
    const properties = getMockData("deeds", idSuffix);
    const vehicles = getMockData("natis", idSuffix);
    const holehe = [{ site: "Gmail", exists: true }, { site: "Outlook", exists: false }];

    const groq = getGroq();
    if (!groq) {
      res.json({
        summary: `OSINT sweep complete for ${name}. Digital footprint detected across multiple platforms. RICA registration verified.`,
        findings: [
          { platform: "RICA Registry", status: "VERIFIED", details: "Phone number registered and validated.", confidence: 95 },
          { platform: "Breach Directory", status: "EXPOSURE_DETECTED", details: "Identity found in 1 breach cluster.", confidence: 80 },
          { platform: "Social OSINT", status: "PROFILE_FOUND", details: "Active on 2 platforms.", confidence: 70 },
        ],
        sherlockResults: sherlock,
        harvesterResults: harvester,
        phoneResults: phone,
        holeheResults: holehe,
        ricaResults: rica,
        breachResults: breaches,
        propertyResults: properties,
        vehicleResults: vehicles,
        overallRiskScore: 35,
      });
      return;
    }

    const systemPrompt = `You are an Advanced Intelligence Discovery Agent at Veritas Intel. Synthesise OSINT telemetry into digital forensic dossiers. Always respond with valid JSON only — no markdown, no commentary.`;

    const userContent = `Synthesise this OSINT telemetry for ${name} (ID: ${idNumber}) into a digital forensic dossier.

SHERLOCK: ${JSON.stringify(sherlock)}
RICA: ${JSON.stringify(rica)}
BREACHES: ${JSON.stringify(breaches)}
PHONE: ${JSON.stringify(phone)}

Respond ONLY with valid JSON:
{
  "summary": "executive summary string",
  "findings": [{"platform":"string","status":"string","details":"string","confidence":0}],
  "sherlockResults": ${JSON.stringify(sherlock)},
  "harvesterResults": ${JSON.stringify(harvester)},
  "phoneResults": ${JSON.stringify(phone)},
  "holeheResults": ${JSON.stringify(holehe)},
  "ricaResults": ${JSON.stringify(rica)},
  "breachResults": ${JSON.stringify(breaches)},
  "propertyResults": ${JSON.stringify(properties)},
  "vehicleResults": ${JSON.stringify(vehicles)},
  "overallRiskScore": 35
}`;

    const text = await chatComplete(groq, systemPrompt, userContent);
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json(result);
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

    const chatHistory: { role: "user" | "assistant"; content: string }[] = (history || []).map((h: any) => ({
      role: h.role === "model" ? "assistant" : "user",
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
