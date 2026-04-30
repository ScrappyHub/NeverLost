import { useEffect, useState } from "react"
import { listen } from "@tauri-apps/api/event"

import Overview from "./pages/Overview"
import Authority from "./pages/Authority"
import TrustBundle from "./pages/TrustBundle"
import AllowedSigners from "./pages/AllowedSigners"
import Receipts from "./pages/Receipts"
import Settings from "./pages/Settings"

import { getWorkbenchMode } from "./lib/api"

type Page =
  | "overview"
  | "authority"
  | "trust"
  | "signers"
  | "receipts"
  | "settings"

const APP_VERSION = "v1.0.0"
const KEY_MANAGED_MODE = "neverlost.settings.managed_mode"

function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  return raw === "true"
}

export default function App() {
  const [page, setPage] = useState<Page>("overview")
  const [managedMode, setManagedMode] = useState(false)

  async function syncModeFromBackend() {
    try {
      const state = await getWorkbenchMode()
      const isManaged = state.mode === "managed"
      localStorage.setItem(KEY_MANAGED_MODE, isManaged ? "true" : "false")
      setManagedMode(isManaged)
    } catch {
      setManagedMode(readBool(KEY_MANAGED_MODE, false))
    }
  }

  useEffect(() => {
    void syncModeFromBackend()

    const onSettingsChanged = () => {
      void syncModeFromBackend()
    }

    window.addEventListener("neverlost-settings-changed", onSettingsChanged)

    let alive = true
    let cleanup: null | (() => void) = null

    void listen("neverlost_authority_changed", async () => {
      if (!alive) return
      await syncModeFromBackend()
    }).then((unlisten) => {
      cleanup = unlisten
    })

    return () => {
      alive = false
      if (cleanup) cleanup()
      window.removeEventListener("neverlost-settings-changed", onSettingsChanged)
    }
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <h1>NeverLost</h1>
        </div>

        <div className="sidebar-card">
          <div className="card-title">Workbench</div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
            Standalone Authority Instrument
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            {APP_VERSION}
          </div>

          <div style={{ marginTop: 12 }}>
            <span className={managedMode ? "pill pill-green" : "pill pill-neutral"}>
              {managedMode ? "MANAGED MODE" : "LOCAL MODE"}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ display: "grid", gap: 10 }}>
          <button className={page === "overview" ? "active" : ""} onClick={() => setPage("overview")}>
            Overview
          </button>
          <button className={page === "authority" ? "active" : ""} onClick={() => setPage("authority")}>
            Authority
          </button>
          <button className={page === "trust" ? "active" : ""} onClick={() => setPage("trust")}>
            Trust
          </button>
          <button className={page === "signers" ? "active" : ""} onClick={() => setPage("signers")}>
            Signers
          </button>
          <button className={page === "receipts" ? "active" : ""} onClick={() => setPage("receipts")}>
            Receipts
          </button>
          <button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>
            Settings
          </button>
        </nav>
      </aside>

      <main className="main">
        {page === "overview" && <Overview />}
        {page === "authority" && <Authority />}
        {page === "trust" && <TrustBundle />}
        {page === "signers" && <AllowedSigners />}
        {page === "receipts" && <Receipts />}
        {page === "settings" && <Settings />}

        <footer
          className="muted"
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          NeverLost Workbench {APP_VERSION} · Operator Authority Console
        </footer>
      </main>
    </div>
  )
}