import { useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import { toast } from "react-toastify";
import api from "../api/axios";

const parseReceipt = (text) => {
  const amountMatch = text.match(/(\d+\.\d{2})/);
  const dateMatch = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);

  return {
    amount: amountMatch ? amountMatch[0] : "",
    date: dateMatch ? dateMatch[0] : "",
    description: text.split("\n").find((line) => line.trim()) || "",
  };
};

const normalizeDateForInput = (rawDate) => {
  if (!rawDate) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

  const cleaned = rawDate.replace(/\./g, "/").replace(/-/g, "/");
  const parts = cleaned.split("/").map((p) => p.trim());
  if (parts.length !== 3) return "";

  let [p1, p2, p3] = parts;
  let year = p3.length === 2 ? `20${p3}` : p3;
  if (!/^\d+$/.test(p1) || !/^\d+$/.test(p2) || !/^\d+$/.test(year)) return "";

  let day = parseInt(p1, 10);
  let month = parseInt(p2, 10);

  // If first segment is likely month and second likely day, swap to support US format.
  if (day <= 12 && month > 12) {
    const tmp = day;
    day = month;
    month = tmp;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return "";

  return `${year.padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const ReceiptUpload = ({ onExtract, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setRawText("");
    setProgress(0);
    setUploadedUrl("");
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const res = await api.post("/expenses/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const receiptUrl = res.data?.receiptUrl || "";
      setUploadedUrl(receiptUrl);
      onUploaded?.(receiptUrl);
      toast.success("Receipt uploaded to local server");
    } catch (err) {
      toast.error(err.response?.data?.message || "Receipt upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!file || extracting) return;

    setExtracting(true);
    setProgress(0);

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setRawText(text || "");
      const parsed = parseReceipt(text || "");

      onExtract?.({
        amount: parsed.amount,
        expenseDate: normalizeDateForInput(parsed.date),
        description: parsed.description,
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-sm p-3 bg-gray-50">
      <label className="text-sm text-gray-700 mb-2 block">Receipt Upload (OCR)</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full text-sm text-gray-600"
      />

      {previewUrl && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">Preview</p>
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="max-h-56 rounded-sm border border-gray-200"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-3 mr-2 border border-gray-300 text-gray-700 rounded-sm px-3 py-2 text-sm hover:bg-gray-100 transition disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload to Server"}
      </button>

      <button
        type="button"
        onClick={handleExtract}
        disabled={!file || extracting}
        className="mt-3 bg-gray-900 text-white rounded-sm px-3 py-2 text-sm hover:bg-gray-700 transition disabled:opacity-50"
      >
        {extracting ? `Extracting ${progress}%` : "Extract Data"}
      </button>

      {uploadedUrl && (
        <p className="text-xs text-green-700 mt-2 break-all">
          Uploaded URL: {uploadedUrl}
        </p>
      )}

      {rawText && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer">Show extracted text</summary>
          <pre className="mt-2 text-xs bg-white border border-gray-200 rounded-sm p-2 max-h-32 overflow-auto whitespace-pre-wrap">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  );
};

export default ReceiptUpload;
