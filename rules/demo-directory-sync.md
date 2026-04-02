# Do NOT Touch the Demo Directory

## Rule
The `/go/demo/` directory is auto-generated and used for local testing only. Do NOT edit, copy to, or sync files in that directory. Ever.

## Why This Matters
The demo directory is rebuilt from scratch by `run-local.sh`. Any manual changes or syncs to it are wasted effort — they will be overwritten on the next run. The source of truth is always the source web directory (e.g., `go/erp/ui/web/` for l8erp, `go/bugs/website/web/` for l8bugs).

## What This Means
- Do NOT `cp` source files into `go/demo/web/`
- Do NOT edit files under `go/demo/` directly
- Do NOT diff source against demo to check for sync
- Only edit files in the source web directory — `run-local.sh` handles the rest
