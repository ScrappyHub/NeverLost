import { useEffect, useMemo, useState } from "react"
import { listen } from "@tauri-apps/api/event"

import {
  getAllowedSignersInfo,
  getAuthorityStatus,
  getTrustBundleInfo,
  getWorkbenchMode,
} from "../lib/api"

import type {
  AllowedSignersInfo,
  AuthorityStatus,
  TrustBundleInfo,
} from "../lib/types"

function parseUtc(value: string): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

function humanDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function Overview() {
  const [authority, setAuthority] = useState<AuthorityStatus | null>(null)
  const [trust, setTrust] = useState<TrustBundleInfo | null>(null)
  const [signers, setSigners] = useState<AllowedSignersInfo | null>(null)
  const [mode, setMode] = useState<"local" | "managed">("local")
  const [nowMs, setNowMs] = useState(Date.now())

  async function load() {
    const [a, t, s, m] = await Promise.all([
      getAuthorityStatus(),
      getTrustBundleInfo(),
      getAllowedSignersInfo(),
      getWorkbenchMode(),
    ])

    setAuthority(a)
    setTrust(t)
    setSigners(s)
    setMode(m.mode)

    localStorage.setItem(
      "neverlost.settings.managed_mode",
      m.mode === "managed" ? "true" : "false",
    )
    }

  useEffect(() => {
    void load()

    const localRefresh = () => {
      void load()
    }

    window.addEventListener("neverlost-authority-changed", localRefresh)
    window.addEventListener("neverlost-settings-changed", localRefresh)

    let alive = true
    let cleanup: null | (() => void) = null

    void listen("neverlost_authority_changed", async () => {
      if (!alive) return
      await load()
    }).then((unlisten) => {
      cleanup = unlisten
    })

    return () => {
      alive = false
      if (cleanup) cleanup()
      window.removeEventListener("neverlost-authority-changed", localRefresh)
      window.removeEventListener("neverlost-settings-changed", localRefresh)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const sessionDuration = useMemo(() => {
    const started = parseUtc(authority?.started_utc ?? "")
    if (started === null) return ""

    const ended = parseUtc(authority?.ended_utc ?? "")
    if (authority?.active) {
      return `Session active for ${humanDuration(nowMs - started)}`
    }

    if (ended !== null) {
      return `Session was active for ${humanDuration(ended - started)}`
    }

    return ""
  }, [authority, nowMs])

  return (
    <div>
      <div className="page-title">NeverLost Workbench</div>

      <div className="grid grid-3">
        <section className="card">
          <div className="card-title">Authority Status</div>
          <div style={{ marginBottom: 10 }}>
            <span className={authority?.active ? "pill pill-green" : "pill pill-neutral"}>
              {authority?.active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
          <div className="muted" style={{ overflowWrap: "anywhere" }}>
            {authority?.principal ?? ""}
          </div>
        </section>

        <section className="card">
          <div className="card-title">Session Mode</div>
          <span className={mode === "managed" ? "pill pill-green" : "pill pill-neutral"}>
            {mode === "managed" ? "MANAGED MODE" : "LOCAL MODE"}
          </span>
        </section>

        <section className="card">
          <div className="card-title">Allowed Signers</div>
          <div style={{ marginBottom: 10 }}>
            <span className="pill pill-green">READY</span>
          </div>
          <div className="muted" style={{ overflowWrap: "anywhere" }}>
            {signers?.sha256 ?? ""}
          </div>
        </section>
      </div>

      <section className="card section">
        <div className="card-title">Current Session</div>

        <div style={{ marginBottom: 12 }}>
          <span className={authority?.active ? "pill pill-green" : "pill pill-neutral"}>
            {authority?.active ? "SESSION ACTIVE" : "NO ACTIVE SESSION"}
          </span>
        </div>

        <div className="grid" style={{ gap: 8 }}>
          <div>Principal: {authority?.principal ?? ""}</div>
          <div style={{ overflowWrap: "anywhere" }}>
            Session ID: {authority?.session_id ?? ""}
          </div>
          <div>Started: {authority?.started_utc ?? ""}</div>
          <div>Ended: {authority?.ended_utc ?? ""}</div>
          {sessionDuration ? <div>{sessionDuration}</div> : null}
        </div>
      </section>

      <section className="card section">
        <div className="card-title">Identity Summary</div>
        <div className="grid" style={{ gap: 8 }}>
          <div>Expected Principal: {trust?.expected_principal ?? ""}</div>
          <div>Namespaces: {trust?.expected_namespaces?.length ?? 0}</div>
          <div style={{ overflowWrap: "anywhere" }}>
            Allowed Signers SHA-256: {signers?.sha256 ?? ""}
          </div>
        </div>
      </section>
    </div>
  )
}