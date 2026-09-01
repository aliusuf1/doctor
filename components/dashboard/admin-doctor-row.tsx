"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminGetLicenseUrl,
  adminSetDoctorActive,
  adminSetVerified,
} from "@/lib/actions/admin";

export function AdminDoctorRow({
  id,
  name,
  slug,
  active,
  onboarded,
  verified,
  hasLicense,
  joined,
}: {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  onboarded: boolean;
  verified: boolean;
  hasLicense: boolean;
  joined: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function viewLicense() {
    setMsg(null);
    const r = await adminGetLicenseUrl(id);
    if (r.ok && r.url) window.open(r.url, "_blank");
    else setMsg(r.error ?? "No document");
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div>
        <Link href={`/doctors/${slug}`} className="font-medium hover:underline">
          {name}
        </Link>
        <span className="ml-2 text-xs text-ink-faint">
          /{slug} · joined {joined}
          {!onboarded && " · onboarding incomplete"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`badge ${
            active
              ? "border-ok bg-ok-tint text-ok"
              : "border-warn bg-warn-tint text-warn"
          }`}
        >
          {active ? "Live" : "Hidden"}
        </span>
        {verified && (
          <span className="badge border-ok bg-ok-tint text-ok">Verified</span>
        )}

        {hasLicense && (
          <button
            onClick={viewLicense}
            className="btn btn-outline px-2.5 py-1 text-xs"
          >
            View licence
          </button>
        )}
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await adminSetVerified(id, !verified);
              router.refresh();
            })
          }
          className="btn btn-outline px-2.5 py-1 text-xs"
        >
          {verified ? "Unverify" : "Mark verified"}
        </button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await adminSetDoctorActive(id, !active);
              router.refresh();
            })
          }
          className="btn btn-outline px-2.5 py-1 text-xs"
        >
          {active ? "Hide" : "Enable"}
        </button>
        {msg && <span className="text-xs text-danger">{msg}</span>}
      </div>
    </li>
  );
}
