"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Video, MapPin } from "lucide-react";
import {
  doctorCancel,
  getProofUrl,
  markStatus,
  setMeetLink,
  verifyPaymentAndConfirm,
} from "@/lib/actions/appointments";
import { formatPkr } from "@/lib/utils";

interface Row {
  id: string;
  startsAt: string;
  startsAtLabel: string;
  mode: "online" | "in_person";
  status: string;
  paymentMethod: "online" | "bank_transfer" | null;
  paymentStatus: string;
  hasProof: boolean;
  meetLink: string | null;
  concern: string | null;
  feePkr: number | null;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}

const STATUS_CLS: Record<string, string> = {
  confirmed: "border-ok bg-ok-tint text-ok",
  pending_payment: "border-warn bg-warn-tint text-warn",
  completed: "border-line bg-cream-deep text-ink-soft",
  cancelled: "border-danger bg-danger-tint text-danger",
  no_show: "border-danger bg-danger-tint text-danger",
};

export function AppointmentsTable({
  rows,
  timezone,
}: {
  rows: Row[];
  timezone: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-cream-deep text-left text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-2.5">When ({timezone})</th>
            <th className="px-4 py-2.5">Patient</th>
            <th className="px-4 py-2.5">Mode</th>
            <th className="px-4 py-2.5">Payment</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <RowItem
              key={r.id}
              r={r}
              open={openId === r.id}
              onToggle={() => setOpenId((v) => (v === r.id ? null : r.id))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowItem({
  r,
  open,
  onToggle,
}: {
  r: Row;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState(r.meetLink ?? "");
  const [cancelReason, setCancelReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setMsg(res.error ?? "Failed");
    });
  }

  async function viewProof() {
    setMsg(null);
    const res = await getProofUrl(r.id);
    if (res.ok && res.url) window.open(res.url, "_blank");
    else setMsg(res.error ?? "No receipt");
  }

  return (
    <>
      <tr className="cursor-pointer hover:bg-cream" onClick={onToggle}>
        <td className="px-4 py-3">{r.startsAtLabel}</td>
        <td className="px-4 py-3">{r.patientName}</td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-ink-soft">
            {r.mode === "online" ? <Video size={14} /> : <MapPin size={14} />}
            {r.mode === "online" ? "Online" : "In person"}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-ink-soft">
            {r.paymentMethod === "online" ? "Online" : "Bank transfer"} ·{" "}
            {r.paymentStatus}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`badge ${STATUS_CLS[r.status] ?? ""}`}>
            {r.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-xs text-green">
          {open ? "Hide" : "Manage"}
        </td>
      </tr>

      {open && (
        <tr className="bg-cream">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wide text-ink-faint">
                  Patient
                </p>
                <p className="mt-1">{r.patientName}</p>
                <p className="text-ink-soft">{r.patientEmail}</p>
                <p className="text-ink-soft">{r.patientPhone}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-ink-faint">
                  Concern
                </p>
                <p className="mt-1 text-ink-soft">{r.concern || "—"}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-ink-faint">
                  Fee
                </p>
                <p className="mt-1">{formatPkr(r.feePkr)}</p>
              </div>

              <div className="space-y-3 text-sm">
                {(r.status === "pending_payment" ||
                  r.status === "confirmed" ||
                  (r.paymentMethod === "bank_transfer" && r.hasProof)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {r.paymentMethod === "bank_transfer" && r.hasProof && (
                      <button
                        onClick={viewProof}
                        className="btn btn-outline h-9 shrink-0 px-3 text-xs"
                      >
                        <FileText size={14} /> View receipt
                      </button>
                    )}
                    {r.status === "pending_payment" && (
                      <button
                        disabled={pending}
                        onClick={() => run(() => verifyPaymentAndConfirm(r.id))}
                        className="btn btn-primary h-9 shrink-0 px-3 text-xs"
                      >
                        {pending && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Mark paid &amp; confirm
                      </button>
                    )}
                    {r.status === "confirmed" && (
                      <>
                        <button
                          disabled={pending}
                          onClick={() => run(() => markStatus(r.id, "completed"))}
                          className="btn btn-outline h-9 shrink-0 px-3 text-xs"
                        >
                          Mark completed
                        </button>
                        <button
                          disabled={pending}
                          onClick={() => run(() => markStatus(r.id, "no_show"))}
                          className="btn btn-outline h-9 shrink-0 px-3 text-xs"
                        >
                          No-show
                        </button>
                      </>
                    )}
                  </div>
                )}

                {r.mode === "online" && r.status !== "cancelled" && (
                  <div className="flex items-center gap-2">
                    <input
                      className="field h-9 min-w-0 flex-1 py-0 text-xs"
                      placeholder="Meet / video link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                    <button
                      disabled={pending}
                      onClick={() => run(() => setMeetLink(r.id, link))}
                      className="btn btn-outline h-9 shrink-0 px-3 text-xs"
                    >
                      Save
                    </button>
                  </div>
                )}

                {r.status !== "cancelled" && r.status !== "completed" && (
                  <div className="flex items-center gap-2">
                    <input
                      className="field h-9 min-w-0 flex-1 py-0 text-xs"
                      placeholder="Cancellation reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <button
                      disabled={pending}
                      onClick={() => run(() => doctorCancel(r.id, cancelReason))}
                      className="btn btn-outline h-9 shrink-0 px-3 text-xs text-danger"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {msg && <p className="text-xs text-danger">{msg}</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
