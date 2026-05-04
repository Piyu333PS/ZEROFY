"use client";

import { useState, useRef, useCallback } from "react";

// ─── Dependencies (install karein) ───────────────────────────────────────────
// npm install pdfjs-dist docx
// ─────────────────────────────────────────────────────────────────────────────

export default function PdfToWord() {
  const [stage, setStage] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const extractedTextRef = useRef("");
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
    extractedTextRef.current = "";
    fileNameRef.current = "";
    if (inputRef.current) inputRef.current.value = "";
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setStage("error");
  };

  const extractPDF = useCallback(async (arrayBuffer) => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      // Worker version must match installed pdfjs-dist version exactly
      const pdfjsVersion = pdfjsLib.version;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      let allText = "";

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        allText += pageText + "\n\n";
        const pct = Math.round((i / total) * 80) + 10;
        setProgress(pct);
        setProgressLabel(`Page ${i} of ${total} extract ho rahi hai...`);
      }

      const trimmed = allText.trim();
      if (!trimmed) {
        showError(
          "PDF mein readable text nahi mila. Scanned/image-based PDF ho sakti hai."
        );
        return;
      }

      extractedTextRef.current = trimmed;
      setProgress(100);
      setProgressLabel("Tayyar hai!");
      setWordCount(trimmed.split(/\s+/).filter(Boolean).length);
      setPageCount(total);
      setStage("done");
    } catch (err) {
      showError("PDF read nahi ho saki: " + err.message);
    }
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (file.type !== "application/pdf") {
        showError("Sirf .pdf files allowed hain.");
        return;
      }
      fileNameRef.current = file.name.replace(/\.pdf$/i, "");
      setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) });
      setStage("processing");
      setProgress(10);
      setProgressLabel("PDF load ho raha hai...");

      const reader = new FileReader();
      reader.onload = (e) => extractPDF(e.target.result);
      reader.readAsArrayBuffer(file);
    },
    [extractPDF]
  );

  const downloadDocx = async () => {
    const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import("docx");

    const paragraphs = extractedTextRef.current
      .split(/\n\n+/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map(
        (text) =>
          new Paragraph({
            children: [new TextRun({ text, size: 24 })],
            spacing: { after: 200 },
          })
      );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: fileNameRef.current, bold: true, size: 32 }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            ...paragraphs,
          ],
        },
      ],
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

      {/* Back Button + Breadcrumb — Zerofy style */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            borderRadius: 999,
            border: "1px solid #3f3f46",
            background: "#27272a",
            color: "#e4e4e7",
          }}
        >
          ‹ Back
        </button>
        <span style={{ fontSize: 13, color: "#71717a" }}>
          Home &rsaquo; PDF → Word
        </span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>PDF → Word</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        PDF upload karein — editable .docx file download hogi
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
            borderRadius: 12,
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "#eff6ff" : "#f9fafb",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 4px" }}>
            PDF drag karein ya click karें
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Sirf .pdf files supported
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

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
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#3b82f6",
                borderRadius: 999,
                transition: "width 0.3s",
              }}
            />
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
              {wordCount.toLocaleString()} words · {pageCount} pages extract hue
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={downloadDocx}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                borderRadius: 8,
                border: "none",
                background: "#1d4ed8",
                color: "#fff",
              }}
            >
              ⬇ Word File Download Karein
            </button>
            <button
              onClick={reset}
              style={{
                padding: "10px 16px",
                fontSize: 14,
                cursor: "pointer",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
              }}
            >
              Naya PDF
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {stage === "error" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 500, color: "#991b1b", margin: "0 0 4px" }}>⚠ Error aaya</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px" }}>{errorMsg}</p>
          <button
            onClick={reset}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
            }}
          >
            Dobara try karein
          </button>
        </div>
      )}
    </div>
  );
}
