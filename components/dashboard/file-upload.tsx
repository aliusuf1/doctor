"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function FileUpload({
  kind,
  accept,
  label,
  hint,
  currentUrl,
}: {
  kind: "photo" | "license";
  accept: string;
  label: string;
  hint?: string;
  currentUrl?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/dashboard/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.url) setPreview(data.url as string);
      setMsg("Uploaded.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-3">
        {kind === "photo" && preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="size-14 rounded-full object-cover"
          />
        )}
        <label className="btn btn-outline cursor-pointer px-3 py-2 text-xs">
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          Choose file
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={onChange}
            disabled={busy}
          />
        </label>
        {kind === "license" && currentUrl && (
          <span className="text-xs text-ok">Document on file</span>
        )}
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      )}
      {msg && <p className="mt-1 text-xs text-ok">{msg}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
