export type EvidenceBundle = {
  ok: boolean
  token: string
  run_id: string
  run_dir: string
  stdout_path: string
  stderr_path: string
  sha256sums_path: string
  stdout: string
  stderr: string
  source?: string
  source_detail?: string
  actor_id?: string
  actor_role?: string
  actor_display_name?: string
}

export type LedgerEntry = {
  raw: string
}

export type FileTextResult = {
  ok: boolean
  path: string
  text: string
}

export type TrustBundleInfo = {
  ok: boolean
  path: string
  expected_principal: string
  expected_namespaces: string[]
  raw_json: string
}

export type AllowedSignersInfo = {
  ok: boolean
  path: string
  text: string
  sha256: string
}

export type LatestRunInfo = {
  kind: string
  run_id: string
  run_dir: string
  stdout_path: string
  stderr_path: string
  sha256sums_path: string
}

export type AuthorityStatus = {
  ok: boolean
  active: boolean
  principal: string
  session_id: string
  started_utc: string
  ended_utc: string
}
export type CliActionResult = {
  ok: boolean
  area: string
  action: string
  exit_code: number
  stdout: string
  stderr: string
  source?: string
  source_detail?: string
  actor_id?: string
  actor_role?: string
  actor_display_name?: string
}
export type WorkbenchModeState = {
  mode: "local" | "managed"
}