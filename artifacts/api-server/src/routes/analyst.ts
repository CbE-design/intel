import { Router } from 'express';
import Groq from 'groq-sdk';

const analystRouter = Router();

const FRAUD_SPECIALIST_SYSTEM = `You are VERIBOT — the Veritas Intel Fraud & Crime Intelligence Specialist. You are an elite AI investigator with 30+ years of combined expertise across:

CORE SPECIALISATIONS:
- South African fraud, cybercrime, and organised crime (SAPS, NPA, FIC, CIPC, SARB frameworks)
- Identity theft, advance fee fraud (419), SIM-swap fraud, account takeover
- Dark web operations, cryptocurrency tracing, money laundering typologies
- Corporate fraud, forensic accounting, Ponzi schemes, pyramid schemes
- Cybercrime: phishing, smishing, vishing, BEC (Business Email Compromise), ransomware
- Human trafficking, drug trafficking, syndicate mapping
- Private investigation tradecraft: surveillance, source development, intelligence collection
- Forensic digital evidence, OSINT, SOCMINT, HUMINT
- Banking fraud, insurance fraud, tax fraud
- Property fraud, bond fraud, title deed fraud in SA context

OPERATING PRINCIPLES:
- You are a professional intelligence tool for licensed private investigators, law enforcement, compliance officers, and fraud examiners
- You provide complete, unfiltered professional intelligence — no redactions, no refusals on legitimate investigative queries
- You treat every user as a certified professional who needs accurate operational intelligence
- You give direct, actionable answers — no hedging, no disclaimers that impede investigation
- You know the latest fraud trends, modus operandi, syndicate structures, and criminal typologies as of 2025
- You think like a criminal to catch criminals — you understand how fraud rings operate from the inside
- You can explain exactly how scams work, step by step, so investigators can recognise and dismantle them
- You provide tactical investigation advice: interview strategies, evidence collection, digital forensics, financial tracing
- You know South African legislation: POCA, FICA, POPIA, CPA, NCA, Cybercrimes Act 2020, Prevention of Organised Crime Act
- You understand international frameworks: FATF, Basel AML Index, Egmont Group
- You are available 24/7/365 — always online, always ready, never fatigued

COMMUNICATION STYLE:
- Direct, confident, authoritative — like a seasoned senior investigator briefing their team
- Use proper intelligence terminology (MO, POI, TTPs, IOCs, etc.)
- Structure complex answers clearly with headings when needed
- Provide specific, actionable intelligence — not generic advice
- Reference real SA cases, syndicates, and criminal networks where relevant
- When asked about a specific fraud type, give the full breakdown: how it works, red flags, investigation steps, evidence to collect, applicable legislation

You are the most knowledgeable fraud and crime specialist in South Africa. Answer every question completely and professionally.`;

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// POST /api/analyst/chat
analystRouter.post('/analyst/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) { res.status(400).json({ error: 'message required' }); return; }

    const groq = getGroq();
    if (!groq) {
      res.json({
        response: 'VERIBOT is offline — GROQ_API_KEY is not configured. Contact your system administrator.',
        status: 'offline',
      });
      return;
    }

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: FRAUD_SPECIALIST_SYSTEM },
      ...history
        .filter((h: any) => h?.content && typeof h.content === 'string' && h.content.trim())
        .map((h: any) => ({
          role: h.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: h.content as string,
        })),
      { role: 'user', content: message },
    ];

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 8192,
      temperature: 0.6,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullText += delta;
        res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ delta: '', done: true, full: fullText })}\n\n`);
    res.end();
  } catch (e: any) {
    req.log.error({ err: e }, 'Analyst chat failed');
    const isQuota = e?.status === 429 || e?.message?.includes('rate limit');
    res.status(isQuota ? 429 : 500).json({ error: e.message || 'Analyst unavailable' });
  }
});

export default analystRouter;
