import jsPDF from "jspdf";
import type { Subject, Report, AuditEntry } from "./types";
import { Timestamp } from "firebase/firestore";

function fmt(ts: Timestamp | Date | string | undefined): string {
  if (!ts) return "N/A";
  try {
    const d = ts instanceof Timestamp
      ? ts.toDate()
      : ts instanceof Date
        ? ts
        : new Date(ts as string);
    return d.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
  } catch { return "N/A"; }
}

export function exportSubjectDossier(
  subject: Subject,
  report?: Report | null,
  auditLog?: AuditEntry[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ── Header bar ────────────────────────────────────────────────────
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("VERITAS INTEL", margin, 11);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("INTELLIGENCE DOSSIER — RESTRICTED", margin, 17);
  doc.text(`Generated: ${new Date().toLocaleString("en-ZA")}`, margin, 22);

  // Classification stamp (right)
  doc.setFillColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CONFIDENTIAL", W - margin, 15, { align: "right" });
  doc.text("AUTHORISED USE ONLY", W - margin, 21, { align: "right" });

  let y = 38;

  // ── Subject block ──────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SUBJECT IDENTITY", margin, y);
  y += 1;
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y + 1, W - margin, y + 1);
  y += 6;

  const subjectFields = [
    ["Full Name", subject.name],
    ["National ID", subject.idNumber],
    ["Address", subject.address || "—"],
    ["RICA Phone", subject.phoneNumber || "—"],
    ["Status", subject.status],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  subjectFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 32, y);
    y += 6;
  });

  y += 4;

  // ── Intelligence Report ────────────────────────────────────────────
  if (report) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("INTELLIGENCE ASSESSMENT", margin, y);
    y += 1;
    doc.line(margin, y + 1, W - margin, y + 1);
    y += 6;

    // Risk badge
    const riskColor: Record<string, [number, number, number]> = {
      CRITICAL: [180, 0, 0],
      CAUTION: [160, 100, 0],
      CLEAR: [0, 100, 0],
    };
    const [r, g, b] = riskColor[report.riskAssessment] ?? [80, 80, 80];
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, y - 4, 40, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(report.riskAssessment, margin + 20, y + 0.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Confidence: ${report.verificationScore}%`, margin + 45, y + 0.5);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(report.report || "", W - margin * 2);
    lines.forEach((line: string) => {
      if (y > H - 30) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // ── Audit Log ──────────────────────────────────────────────────────
  if (auditLog && auditLog.length > 0) {
    if (y > H - 60) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OPERATIONAL AUDIT LOG", margin, y);
    y += 1;
    doc.line(margin, y + 1, W - margin, y + 1);
    y += 6;

    doc.setFontSize(7.5);
    auditLog.slice(0, 15).forEach((entry) => {
      if (y > H - 20) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`[${entry.analyst}]`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(entry.action, margin + 22, y);
      doc.setTextColor(120, 120, 120);
      doc.text(fmt(entry.timestamp as any), W - margin, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 5.5;
    });
    y += 4;
  }

  // ── Footer ─────────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, H - 12, W - margin, H - 12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text("VERITAS INTEL — CONFIDENTIAL INTELLIGENCE DOSSIER — AUTHORISED USE ONLY", W / 2, H - 7, { align: "center" });
    doc.text(`Page ${i} of ${totalPages}`, W - margin, H - 7, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  const filename = `VERITAS-DOSSIER-${subject.name.toUpperCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  doc.save(filename);
}
