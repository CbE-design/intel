import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface PdfExportButtonProps {
  targetId: string;
  filename?: string;
  className?: string;
  label?: string;
}

export function PdfExportButton({ targetId, filename = 'veritas-report', className, label }: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const exportPdf = async () => {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const element = document.getElementById(targetId);
      if (!element) { console.error('Element not found:', targetId); return; }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPos = 10;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        yPos = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`rounded-none text-xs uppercase font-black ${className ?? ''}`}
      onClick={exportPdf}
      disabled={loading}
      title="Export as PDF"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
