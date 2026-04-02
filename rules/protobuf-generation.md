# Protobuf Generation (CRITICAL)

## Rule
Whenever ANY `.proto` file is created, modified, or removed, you **MUST** run `make-bindings.sh` to regenerate ALL protobuf bindings. **NO EXCEPTIONS.**

**NEVER attempt to compile individual proto files manually.** Do NOT run individual `docker run` commands or `protoc` commands. The ONLY way to generate bindings is via `make-bindings.sh`. This is a hard requirement — violating it wastes time and produces errors.

## How to Run

```bash
cd proto && ./make-bindings.sh
```

**Before running**, check that `make-bindings.sh` uses `-i` (not `-it`) on all `docker run` commands. The `-t` flag requires a TTY and will fail when run from Claude Code or other non-interactive environments. If you see `-it`, change it to `-i`.

**What will break if you try other methods:**
- Running individual `docker run` commands manually — misses dependency ordering, move steps, and sed fixups
- Running `wget` + `protoc` commands manually — misses the full pipeline
- Running from any directory other than `proto/` — paths break

The script handles everything automatically:
1. Downloads `api.proto` dependency
2. Compiles ALL proto files in the correct order
3. Moves generated `.pb.go` files to `/go/types/`
4. Fixes import paths

## When to Run
- After ANY change to ANY `.proto` file (add field, remove field, add message, remove message, add import, etc.)
- After adding a new `.proto` file (also update `make-bindings.sh` to include it)
- After removing a `.proto` file (also update `make-bindings.sh` to remove it)

## Why This Matters
- Generated .pb.go files contain the actual Go struct definitions
- Field names in generated code may differ from what you expect
- Building code that uses these types before generation will fail
- Mock data generators, services, and UI code all depend on these types
- The script handles cross-file imports, dependency ordering, and path fixups that manual compilation misses

## After Running
1. Verify `.pb.go` files exist in `/go/types/<module>/`
2. Build dependent code to ensure types are correct: `go build ./...`

## Field Name Verification
After generation, verify field names by checking the .pb.go files:
```bash
grep -A 30 "type TypeName struct" go/types/<module>/*.pb.go | grep 'json:"'
```
