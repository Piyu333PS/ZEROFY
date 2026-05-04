"use client";

import { useState, useRef, useCallback } from "react";

// ─── Dependencies (install karein) ───────────────────────────────────────────
// npm install pdf-lib
// ─────────────────────────────────────────────────────────────────────────────

export default function ProtectPdf() {
  const [stage, setStage] = useState("idle"); // idle | ready | processing | done | error
  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const pdfBytesRef = useRef(null);
  const fileNameRef = useRef("");
  const inputRef = useRef(null);

  const reset = () => {
    setStage("idle");
    setFileInfo(null);
    setPassword("");
    setConfirmPassword("");
    setShowPass(false);
    setErrorMsg("");
    setProgress(0);
    pdfBytesRef.current = null;
    fileNameRef.current = "";
    if (inputRef.current) inputRef.current.value = "";
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setStage("error");
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showError("Sirf .pdf files allowed hain.");
      return;
    }
    fileNameRef.current = file.name.replace(/\.pdf$/i, "");
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) });

    const reader = new FileReader();
    reader.onload = (e) => {
      pdfBytesRef.current = new Uint8Array(e.target.result);
      setStage("ready");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleProtect = async () => {
    if (!password) { setErrorMsg("Password enter karein."); return; }
    if (password.length < 4) { setErrorMsg("Password kam se kam 4 characters ka hona chahiye."); return; }
    if (password !== confirmPassword) { setErrorMsg("Dono passwords match nahi kar rahe."); return; }

    setErrorMsg("");
    setStage("processing");
    setProgress(30);

    try {
      // pdfcpu-wasm: reliable browser-side PDF encryption
      const pdfcpu = await import("https://cdn.jsdelivr.net/npm/pdfcpu-wasm@0.4.1/dist/pdfcpu.js");
      await pdfcpu.default();
      setProgress(60);

      const result = await pdfcpu.encrypt(
        pdfBytesRef.current,
        { userPW: password, ownerPW: password + "_owner" }
      );
      setProgress(100);

      const blob = new Blob([result], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileNameRef.current}_protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStage("done");
    } catch (err) {
      // Fallback: qpdf-wasm
      try {
        setProgress(50);
        const qpdf = await import("https://cdn.jsdelivr.net/npm/qpdf-wasm@0.0.5/dist/qpdf.js");
        const instance = await qpdf.default();
        setProgress(70);

        instance.FS.writeFile("input.pdf", pdfBytesRef.current);
        instance.callMain([
          "--encrypt", password, password + "_owner", "128",
          "--", "input.pdf", "output.pdf"
        ]);
        const outBytes = instance.FS.readFile("output.pdf");
        setProgress(100);

        const blob = new Blob([outBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileNameRef.current}_protected.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setStage("done");
      } catch (err2) {
        showError("PDF protect nahi ho saki. Browser mein PDF encryption ke liye server support chahiye. Error: " + err.message);
      }
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 4) return { label: "Bahut weak", color: "#ef4444", width: "20%" };
    if (password.length < 7) return { label: "Weak", color: "#f97316", width: "40%" };
    if (password.length < 10) return { label: "Medium", color: "#eab308", width: "65%" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { label: "Strong", color: "#22c55e", width: "100%" };
    return { label: "Good", color: "#3b82f6", width: "80%" };
  };

  const strength = passwordStrength();

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
          Home &rsaquo; Protect PDF
        </span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Protect PDF</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        PDF ko password se lock karein — sirf aap hi open kar sakein
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
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 4px" }}>
            PDF drag karein ya click karein
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

      {/* Ready — File selected, password input */}
      {stage === "ready" && fileInfo && (
        <div>
          {/* File Card */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{fileInfo.name}</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{fileInfo.size} KB</p>
            </div>
            <button
              onClick={reset}
              style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              ✕ Change
            </button>
          </div>

          {/* Password Fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password enter karein"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 12px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af" }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 3, background: "#e5e7eb", borderRadius: 999 }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 999, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 12, color: strength.color, margin: "4px 0 0" }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Password Confirm Karein</label>
            <input
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Dobara password enter karein"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: `1px solid ${confirmPassword && confirmPassword !== password ? "#fca5a5" : "#d1d5db"}`,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Passwords match nahi kar rahe</p>
            )}
          </div>

          {errorMsg && (
            <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 10 }}>⚠ {errorMsg}</p>
          )}

          <button
            onClick={handleProtect}
            disabled={!password || password !== confirmPassword}
            style={{
              width: "100%",
              padding: "11px",
              fontSize: 14,
              fontWeight: 500,
              cursor: password && password === confirmPassword ? "pointer" : "not-allowed",
              borderRadius: 8,
              border: "none",
              background: password && password === confirmPassword ? "#1d4ed8" : "#93c5fd",
              color: "#fff",
              transition: "background 0.2s",
            }}
          >
            🔒 PDF Ko Protect Karein
          </button>
        </div>
      )}

      {/* Processing */}
      {stage === "processing" && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 12px" }}>PDF protect ho rahi hai...</p>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 999 }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#3b82f6",
                borderRadius: 999,
                transition: "width 0.4s",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            {progress < 50 ? "Library load ho rahi hai..." : progress < 80 ? "Encryption apply ho rahi hai..." : "Almost done..."}
          </p>
        </div>
      )}

      {/* Done */}
      {stage === "done" && (
        <div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12 }}>
            <p style={{ fontWeight: 500, color: "#166534", margin: "0 0 4px" }}>✓ PDF protect ho gayi!</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              File download ho gayi — ab sirf password se hi open hogi
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: 14,
              cursor: "pointer",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
            }}
          >
            Naya PDF Protect Karein
          </button>
        </div>
      )}

      {/* Error */}
      {stage === "error" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 500, color: "#991b1b", margin: "0 0 4px" }}>⚠ Error aaya</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px" }}>{errorMsg}</p>
          <button
            onClick={reset}
            style={{ padding: "6px 14px", fontSize: 13, cursor: "pointer", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151" }}
          >
            Dobara try karein
          </button>
        </div>
      )}
    </div>
  );
}
