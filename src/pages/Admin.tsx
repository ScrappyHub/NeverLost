import { useEffect, useMemo, useState } from "react"

import { getAuthorityStatus, readFileText } from "../lib/api"
import type { AuthorityStatus } from "../lib/types"

const ADMIN_RECEIPTS_PATH =
  "C:\\dev\\neverlost\\proofs\\receipts\\admin_plugin\\admin_actions.ndjson"

type AdminReceipt = {
  action?: string
  admin_actor?: string
  cli_exit_code?: number
  decision?: string
  node_id?: string
  ok?: boolean
  principal?: string
  reason?: string
  schema?: string
  session_id?: string
  target_mode?: string
  time_utc?: string
}

function parseReceipts(raw: string): AdminReceipt[] {
  const lines = raw.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
  const parsed: AdminReceipt[] = []

  for (const line of lines) {
    try {
      parsed.push(JSON.parse(line) as AdminReceipt)
    } catch {
      parsed.push({
        action: "invalid",
        ok: false,
        reason: "INVALID_JSON",
      })
    }
  }

  return parsed
}

function shortId(value?: string): string {
  if (!value) return ""
  if (value.length <= 24) return value
  return `${value.slice(0, 12)}...${value.slice(-8)}`
}

export default function Admin() {
  const [status, setStatus] = useState<AuthorityStatus | null>(null)
  const [receiptText, setReceiptText] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    setMessage("")

    try {
      const s = await getAuthorityStatus()
      setStatus(s)

      try {
        const text = await readFileText(ADMIN_RECEIPTS_PATH)
        setReceiptText(text)
      } catch {
        setReceiptText("")
      }

      setMessage("Admin view refreshed.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const receipts = useMemo(() => {
    return parseReceipts(receiptText).slice(-8).reverse()
  }, [receiptText])

  const latest = receipts.length > 0 ? receipts[0] : null

  return (
    <div>
      <div className="page-title">Admin View</div>

      <section className="card">
        <div className="card-title">Managed Admin Surface</div>

        <div className="grid" style={{ gap: 10 }}>
          <div>
            Minimal local admin observer over the sealed NeverLost authority core.
          </div>
          <div className="muted">
            No remote transport. No machine-to-machine connection yet.
          </div>

          <div>
            <button onClick={() => void refresh()} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh Admin View"}
            </button>
          </div>

          {message ? <div className="muted">{message}</div> : null}
        </div>
      </section>

      <div className="grid grid-2 section">
        <section className="card">
          <div className="card-title">Active Session</div>

          <div style={{ marginBottom: 12 }}>
            <span className={status?.active ? "pill pill-green" : "pill pill-neutral"}>
              {status?.active ? "ONLINE / ACTIVE" : "OFFLINE / INACTIVE"}
            </span>
          </div>

          <div className="grid" style={{ gap: 8 }}>
            <div>
              <div className="muted">Principal</div>
              <div style={{ overflowWrap: "anywhere" }}>{status?.principal ?? ""}</div>
            </div>

            <div>
              <div className="muted">Session ID</div>
              <div style={{ overflowWrap: "anywhere" }}>{status?.session_id ?? ""}</div>
            </div>

            <div>
              <div className="muted">Started UTC</div>
              <div>{status?.started_utc ?? ""}</div>
            </div>

            <div>
              <div className="muted">Ended UTC</div>
              <div>{status?.ended_utc ?? ""}</div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">Latest Admin Receipt</div>

          {latest ? (
            <div className="grid" style={{ gap: 8 }}>
              <div>
                <span className={latest.ok ? "pill pill-green" : "pill pill-red"}>
                  {latest.ok ? "ALLOW" : "DENY"}
                </span>
              </div>

              <div>Action: {latest.action ?? ""}</div>
              <div>Actor: {latest.admin_actor ?? ""}</div>
              <div>Node: {latest.node_id ?? ""}</div>
              <div>Target Mode: {latest.target_mode ?? ""}</div>
              <div>Decision: {latest.decision ?? ""}</div>
              <div>Reason: {latest.reason || "none"}</div>
              <div title={latest.session_id ?? ""}>Session: {shortId(latest.session_id)}</div>
              <div>UTC: {latest.time_utc ?? ""}</div>
            </div>
          ) : (
            <div className="muted">No admin receipts found.</div>
          )}
        </section>
      </div>

      <section className="card section">
        <div className="card-title">Admin Receipt Trail</div>

        {receipts.length === 0 ? (
          <div className="muted">No admin receipts found.</div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {receipts.map((receipt, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 14,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span className={receipt.ok ? "pill pill-green" : "pill pill-red"}>
                    {receipt.ok ? "OK" : "DENY"}
                  </span>
                  <span className="pill pill-neutral">{receipt.action ?? "unknown"}</span>
                  <span className="pill pill-neutral">{receipt.target_mode ?? "unknown"}</span>
                </div>

                <div className="grid" style={{ gap: 6 }}>
                  <div>Actor: {receipt.admin_actor ?? ""}</div>
                  <div>Node: {receipt.node_id ?? ""}</div>
                  <div>Decision: {receipt.decision ?? ""}</div>
                  <div>Reason: {receipt.reason || "none"}</div>
                  <div>Session: {receipt.session_id ?? ""}</div>
                  <div>UTC: {receipt.time_utc ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}