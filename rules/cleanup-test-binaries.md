# Clean Up Test Binaries

## Rule
When running `go build` to verify compilation, NEVER use `go build ./path/to/main/package/` — for `main` packages this produces a binary named after the directory in the current working directory.

Instead, use one of these safe patterns:

### Preferred: Build all packages at once (no binaries produced)
```bash
go build ./...
```
This compiles everything but discards all binaries, even for `main` packages.

### If you must build a specific main package:
```bash
go build -o /dev/null ./path/to/main/package/
```
This verifies compilation without leaving a binary on disk.

## Why
Leftover binaries clutter the working directory and may accidentally get committed. Build verification only needs to confirm zero errors — it does not need the output binary.

## The Trap
`go build ./path/to/package/` behaves differently depending on the package type:
- **Library package** (`package foo`): No binary produced — safe
- **Main package** (`package main`): Binary produced in the current directory, named after the last directory component (e.g., `go build ./l8id/ui/main1/` produces a `main1` binary) — NOT safe

This distinction is easy to forget, which is why `go build ./...` is the preferred pattern for verification.
