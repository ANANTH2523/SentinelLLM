import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ModelEvaluation } from "../types";

export const generatePDF = (evaluation: ModelEvaluation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // -- Header --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("SentinelLLM Report", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Generated: ${new Date(evaluation.timestamp).toLocaleString()}`, 14, 28);
  doc.text(`Ref ID: ${evaluation.id}`, 14, 33);

  // -- Metadata Box --
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(14, 40, pageWidth - 28, 35, "FD");

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  
  doc.setFont("helvetica", "bold");
  doc.text("Target Model:", 20, 50);
  doc.setFont("helvetica", "normal");
  doc.text(evaluation.modelName, 60, 50);

  doc.setFont("helvetica", "bold");
  doc.text("Architecture:", 20, 58);
  doc.setFont("helvetica", "normal");
  doc.text(evaluation.architecture, 60, 58);

  doc.setFont("helvetica", "bold");
  doc.text("Primary Use Case:", 20, 66);
  doc.setFont("helvetica", "normal");
  doc.text(evaluation.useCase, 60, 66);

  // -- Executive Summary --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("Executive Summary", 14, 90);

  // Risk Score
  doc.setFontSize(12);
  doc.text("Overall Risk Score:", 14, 100);
  
  let riskColor = [239, 68, 68]; // Red
  if (evaluation.overallRiskScore < 40) riskColor = [16, 185, 129]; // Emerald
  else if (evaluation.overallRiskScore < 70) riskColor = [234, 179, 8]; // Yellow
  
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setFontSize(16);
  doc.text(`${evaluation.overallRiskScore}/100`, 60, 100);

  // Counts
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(11);
  doc.text(`Total Threats Identified: ${evaluation.threats.length}`, 14, 110);
  
  const criticalCount = evaluation.threats.filter(t => t.severity === 'Critical').length;
  doc.text(`Critical Vulnerabilities: ${criticalCount}`, 14, 118);

  let yPos = 130;

  // -- Benchmark Table --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Benchmark Scores", 14, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Category', 'Score', 'Details']],
    body: evaluation.scores.map(s => [s.category, `${s.score}%`, s.details]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo 600
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 'auto' }
    }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 15;

  // -- Threats Table --
  doc.text("Detailed Threat Analysis", 14, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Severity', 'Title', 'Mitigation']],
    body: evaluation.threats.map(t => [t.severity, t.title, t.mitigation]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255 }, // Slate 800
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }
    },
    didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
            const severity = data.cell.raw;
            if (severity === 'Critical') data.cell.styles.textColor = [239, 68, 68];
            if (severity === 'High') data.cell.styles.textColor = [249, 115, 22];
            if (severity === 'Medium') data.cell.styles.textColor = [234, 179, 8];
        }
    }
  });

  doc.save(`SentinelLLM_Report_${evaluation.id}.pdf`);
};