import type { Subject, Report, AuditEntry } from "./types";

function fmt(ts: any): string {
  if (!ts) return "N/A";
  try {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
  } catch { return "N/A"; }
}

export function exportSubjectDossier(
  subject: Subject,
  report?: Report | null,
  auditLog?: AuditEntry[]
) {
  const lines: string[] = [
    "VERITAS INTEL — INTELLIGENCE DOSSIER",
    "=".repeat(50),
    `Generated: ${new Date().toLocaleString("en-ZA")}`,
    "",
    "SUBJECT IDENTITY",
    "-".repeat(30),
    `Full Name:   ${subject.name}`,
    `National ID: ${subject.idNumber}`,
    `Address:     ${subject.address || "—"}`,
    `Phone:       ${subject.phoneNumber || "—"}`,
    `Status:      ${subject.status}`,
    "",
  ];

  if (report) {
    lines.push(
      "INTELLIGENCE ASSESSMENT",
      "-".repeat(30),
      `Risk Assessment: ${report.riskAssessment}`,
      `Confidence:      ${report.verificationScore}%`,
      "",
      report.report || "",
      "",
    );
  }

  if (auditLog && auditLog.length > 0) {
    lines.push("OPERATIONAL AUDIT LOG", "-".repeat(30));
    auditLog.slice(0, 20).forEach((entry) => {
      lines.push(`[${entry.analyst}] ${entry.action} — ${fmt(entry.timestamp)}`);
    });
    lines.push("");
  }

  lines.push("VERITAS INTEL — CONFIDENTIAL — AUTHORISED USE ONLY");

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `VERITAS-DOSSIER-${subject.name.toUpperCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
