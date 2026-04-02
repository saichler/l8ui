# Third-Party Code Lives in Vendor

## Rule
All third-party dependencies are vendored. The `vendor/` directory under the **Go module root** (`go/vendor/`) is the location for all external code. When searching for code across the project's dependencies, look in `go/vendor/`, not in `$GOPATH`, module cache, or sibling project directories.

## Vendor Location
The Go module root is `go/` (where `go.mod` lives), so the vendor directory is at:
```
<project-root>/go/vendor/github.com/saichler/<dependency>/...
```

For example, to find the `l8utils` cache package in the `l8orm` project:
```
go/vendor/github.com/saichler/l8utils/go/utils/cache/
```

**Do NOT search sibling directories** like `/home/saichler/proj/src/github.com/saichler/<dep>/` — those are separate checkouts that may be at different versions than what the project depends on. Always use the vendored copy.

## Implications
- When tracing code into dependencies (e.g., `l8bus`, `l8types`, `l8utils`), find the source in `go/vendor/`
- Do NOT use `go get` to fetch code for reading — it's already in `go/vendor/`
- Do NOT read from sibling project directories — they may differ from the vendored version
- After adding or updating any dependency, run the full vendor refresh sequence:
  ```bash
  cd go
  rm -rf go.sum
  rm -rf go.mod
  rm -rf vendor
  go mod init
  GOPROXY=direct GOPRIVATE=github.com go mod tidy
  go mod vendor
  ```
