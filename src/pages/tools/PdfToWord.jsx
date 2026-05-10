"use client";

import { useState, useRef, useCallback } from "react";

export default function PdfToWord() {
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const pagesDataRef = useRef([]);
  const fileNameRef = useRef("");
  const inputRef = useRef(null);

  const reset = () => {
    setStage("idle");
    setProgress(0);
    setProgressLabel("");
    setFileInfo(null);
    setWordCount(0);
    setPageCount(0);
    setErrorMsg("");
    pagesDataRef.current = [];
    fileNameRef.current = "";
    if (inputRef.current) inputRef.current.value = "";
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setStage("error");
  };

  // Group text items into lines based on Y position
  function groupIntoLines(items) {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => {
      const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
      return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
    });

    const lines = [];
    let currentLine = [sorted[0]];
    let currentY = Math.round(sorted[0].transform[5]);

    for (let i = 1; i < sorted.length; i++) {
      const itemY = Math.round(sorted[i].transform[5]);
      if (Math.abs(itemY - currentY) <= 3) {
        currentLine.push(sorted[i]);
      } else {
        lines.push(currentLine);
        currentLine = [sorted[i]];
        currentY = itemY;
      }
    }
    if (currentLine.length) lines.push(currentLine);
    return lines;
  }

  // Detect if a line looks like a table row (multiple spaced columns)
  function isTableRow(line) {
    if (line.length < 2) return false;
    const xs = line.map(item => item.transform[4]).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < xs.length; i++) gaps.push(xs[i] - xs[i - 1]);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return avgGap > 40;
  }

  const extractPDF = useCallback(async (arrayBuffer) => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const pdfjsVersion = pdfjsLib.version;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      const allPages = [];
      let totalWords = 0;

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        // Group items into lines
        const lines = groupIntoLines(content.items);
        const pageLines = [];

        for (const line of lines) {
          const lineText = line.map(item => item.str).join(" ").trim();
          if (!lineText) continue;

          // Detect font size for headings
          const avgFontSize = line.reduce((s, item) => s + Math.abs(item.transform[3]), 0) / line.length;
          const isBold = line.some(item => item.fontName && (item.fontName.toLowerCase().includes('bold') || item.fontName.toLowerCase().includes('black')));
          const isTableLine = isTableRow(line);

          pageLines.push({
            text: lineText,
            fontSize: avgFontSize,
            isBold,
            isTable: isTableLine,
            items: line
          });

          totalWords += lineText.split(/\s+/).filter(Boolean).length;
        }

        allPages.push(pageLines);
        const pct = Math.round((i / total) * 80) + 10;
        setProgress(pct);
        setProgressLabel(`Extracting page ${i} of ${total}...`);
      }

      if (!allPages.some(p => p.length > 0)) {
        showError("No readable text found. This may be a scanned/image-based PDF.");
        return;
      }

      pagesDataRef.current = allPages;
      setProgress(100);
      setProgressLabel("Ready!");
      setWordCount(totalWords);
      setPageCount(total);
      setStage("done");
    } catch (err) {
      showError("Could not read PDF: " + err.message);
    }
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showError("Only .pdf files are supported.");
      return;
    }
    fileNameRef.current = file.name.replace(/\.pdf$/i, "");
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) });
    setStage("processing");
    setProgress(10);
    setProgressLabel("Loading PDF...");
    const reader = new FileReader();
    reader.onload = (e) => extractPDF(e.target.result);
    reader.readAsArrayBuffer(file);
  }, [extractPDF]);

  const downloadDocx = async () => {
    const { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } = await import("docx");

    const docChildren = [];
    const avgFontSizes = pagesDataRef.current.flat().map(l => l.fontSize);
    const maxFontSize = Math.max(...avgFontSizes);
    const medianFontSize = avgFontSizes.sort((a, b) => a - b)[Math.floor(avgFontSizes.length / 2)] || 12;

    for (let pi = 0; pi < pagesDataRef.current.length; pi++) {
      const pageLines = pagesDataRef.current[pi];
      if (pi > 0) {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true }));
      }

      // Group consecutive table rows
      let i = 0;
      while (i < pageLines.length) {
        const line = pageLines[i];

        // Heading detection
        const isLargeFont = line.fontSize > medianFontSize * 1.3;
        const isHeading = (isLargeFont || line.isBold) && line.text.length < 120;

        if (isHeading && line.fontSize >= medianFontSize * 1.5) {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: Math.round(line.fontSize * 1.8) })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }));
          i++;
        } else if (isHeading) {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: Math.round(line.fontSize * 1.6) })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }));
          i++;
        } else if (line.isTable) {
          // Collect consecutive table rows
          const tableRows = [];
          while (i < pageLines.length && pageLines[i].isTable) {
            tableRows.push(pageLines[i]);
            i++;
          }

          // Build docx table
          const rows = tableRows.map(row => {
            const cells = row.items
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map(item => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: item.str.trim(), size: 20 })] })],
                width: { size: Math.round(100 / row.items.length), type: WidthType.PERCENTAGE },
              }));
            return new TableRow({ children: cells });
          });

          if (rows.length > 0) {
            docChildren.push(new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }));
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 120 } }));
          }
        } else {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: line.text, size: 22 })],
            spacing: { after: 80 },
          }));
          i++;
        }
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNameRef.current}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "sans-serif" }}>

      {/* Back */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", fontSize: 13, fontWeight: 500,
            cursor: "pointer", borderRadius: 999,
            border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7",
          }}
        >
          ‹ Back
        </button>
        <span style={{ fontSize: 13, color: "#71717a" }}>Home › PDF → Word</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>PDF → Word</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        Upload a PDF file and download it as an editable .docx file. Headings, paragraphs, and tables are preserved.
      </p>

      {/* Drop Zone */}
      {stage === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${isDragging ? "#3b82f6" : "#d1d5db"}`,
            borderRadius: 12, padding: "2.5rem 1.5rem",
            textAlign: "center", cursor: "pointer",
            background: isDragging ? "#eff6ff" : "#f9fafb",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 4px" }}>
            Drag & drop your PDF here, or click to browse
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Only .pdf files are supported</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])} />

      {/* Processing */}
      {stage === "processing" && fileInfo && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{fileInfo.name}</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{fileInfo.size} KB</p>
            </div>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>
              Processing...
            </span>
          </div>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#3b82f6", borderRadius: 999, transition: "width 0.3s" }} />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{progressLabel}</p>
        </div>
      )}

      {/* Done */}
      {stage === "done" && (
        <div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12 }}>
            <p style={{ fontWeight: 500, color: "#166534", margin: "0 0 4px" }}>✓ Conversion successful!</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {wordCount.toLocaleString()} words · {pageCount} pages · Headings, paragraphs & tables preserved
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={downloadDocx}
              style={{ flex: 1, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff" }}
            >
              ⬇ Download Word File
            </button>
            <button
              onClick={reset}
              style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151" }}
            >
              New PDF
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {stage === "error" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 500, color: "#991b1b", margin: "0 0 4px" }}>⚠ Error</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px" }}>{errorMsg}</p>
          <button
            onClick={reset}
            style={{ padding: "6px 14px", fontSize: 13, cursor: "pointer", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151" }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
