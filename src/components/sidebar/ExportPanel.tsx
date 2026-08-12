import { useRef, useCallback } from "react";
import { useCVStore } from "../../store/cvStore";
import { useUIStore } from "../../store/uiStore";
import { validateCVDocument, ValidationError } from "../../services/jsonValidation";
import { exportAsImagePDF } from "../../services/pdfExport";
import { showToast } from "../ui/Toast";

interface ExportPanelProps {
  saveToCloud: () => Promise<void>;
}

export function ExportPanel({ saveToCloud }: ExportPanelProps) {
  const saving = useUIStore((s) => s.saving);
  const lastSavedAt = useUIStore((s) => s.lastSavedAt);
  const exporting = useUIStore((s) => s.exporting);
  const setExporting = useUIStore((s) => s.setExporting);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonDownload = useCallback(() => {
    const cvDoc = useCVStore.getState().document;
    const blob = new Blob([JSON.stringify(cvDoc, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleJsonRestore = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const validated = validateCVDocument(parsed);
          useCVStore.getState().loadDocument(validated);
          showToast("فایل JSON با موفقیت بارگذاری شد", "success");
        } catch (err) {
          if (err instanceof ValidationError) {
            showToast(`خطا در فایل: ${err.message}`, "error");
          } else if (err instanceof SyntaxError) {
            showToast("فایل JSON نامعتبر است", "error");
          } else {
            showToast("خطای ناشناخته در خواندن فایل", "error");
          }
        }
      };
      reader.onerror = () => {
        showToast("خطا در خواندن فایل", "error");
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const handlePrint = useCallback(async () => {
    setExporting(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    try {
      window.print();
    } finally {
      setExporting(false);
    }
  }, [setExporting]);

  const handlePdfExport = useCallback(async () => {
    setExporting(true);
    try {
      const previewEl = document.getElementById("cv-preview");
      if (!previewEl) return;

      await exportAsImagePDF(previewEl);
    } catch (err) {
      console.error("PDF export failed:", err);
      showToast("خطا در ساخت PDF", "error");
    } finally {
      setExporting(false);
    }
  }, [setExporting]);

  return (
    <div className="flex flex-col gap-2 border-t border-gray-700 pt-4">
      <span className="text-xs font-medium text-gray-400">خروجی و ذخیره‌سازی</span>

      <button
        onClick={saveToCloud}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {saving && (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {saving ? "در حال ذخیره..." : "ذخیره ابری"}
      </button>

      {lastSavedAt && (
        <p className="text-center text-[10px] text-gray-500">
          آخرین ذخیره: {lastSavedAt.toLocaleTimeString("fa-IR")}
        </p>
      )}

      <button
        onClick={handleJsonDownload}
        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 transition-colors hover:bg-gray-700"
      >
        دانلود پشتیبان JSON
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 transition-colors hover:bg-gray-700"
      >
        بازیابی از JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonRestore}
        className="hidden"
      />

      <button
        onClick={handlePrint}
        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 transition-colors hover:bg-gray-700"
      >
        دریافت PDF متنی
      </button>

      <button
        onClick={handlePdfExport}
        disabled={exporting}
        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 transition-colors hover:bg-gray-700 disabled:opacity-50"
      >
        {exporting ? "در حال ساخت PDF..." : "خروجی PDF تصویری"}
      </button>
    </div>
  );
}