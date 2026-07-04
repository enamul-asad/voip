import React, { useState } from "react";
import { Download, FileText, Loader2, CheckCircle } from "lucide-react";
import { downloadInvoice } from "../services/billing"; // Ensure this path is correct

export default function InvoiceButton({ 
  invoiceId, 
  month = "Jan", 
  year = 2026,
  filename = "Invoice.pdf"
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setSuccess(false);

      // 1. Fetch the PDF Blob
      const res = await downloadInvoice(invoiceId, year);
      
      // 2. Create Download Link
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Invoice_${month}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // 3. Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 4. Show Success State briefly
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`
        group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
        ${success 
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
          : "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {/* Icon Logic */}
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : success ? (
        <CheckCircle size={16} />
      ) : (
        <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
      )}

      {/* Text Logic */}
      <span>
        {loading ? "Downloading..." : success ? "Downloaded" : "Invoice"}
      </span>
    </button>
  );
}