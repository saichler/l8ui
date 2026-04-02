# Test Location and Approach

## Rule
All tests MUST live in the `go/tests/` directory. Do NOT place `_test.go` files alongside source code in package directories (e.g., do NOT create `go/alm/correlation/engine_test.go`).

Tests MUST use the system API (IVNic, service endpoints, HTTP calls) to exercise functionality end-to-end. Do NOT write unit tests that directly call unexported/internal functions. The test should interact with the system the same way a real client would.

## Why This Matters
- Tests alongside source code in package directories have access to unexported internals, which couples tests to implementation details and makes refactoring harder.
- Testing through the system API validates the full stack (validation, callbacks, persistence, service routing) rather than isolated functions.
- Centralizing tests in `go/tests/` keeps the source tree clean and makes it easy to find and run all tests.

## Correct Pattern
```
go/tests/
├── mocks/          # Mock data generators
├── integration/    # Integration tests using IVNic
└── ...
```

Tests should:
1. Set up the system (IVNic, services)
2. Call service endpoints (POST, GET, PUT, DELETE) via the API
3. Assert on the API responses

## Wrong Pattern
```
go/alm/correlation/engine_test.go      # WRONG: test next to source
go/alm/common/validation_test.go       # WRONG: test next to source
```

## Verification
Before creating any test file, check its path:
```bash
# All test files must be under go/tests/
find go/ -name "*_test.go" -not -path "go/tests/*"
# If any results appear, those tests are in the wrong location
```
