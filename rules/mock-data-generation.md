# Mock Data Generation for New ERP Modules

## Location
All mock data files live in `go/tests/mocks/`. The system generates phased, dependency-ordered mock data with realistic ("flavorable") distributions.

## Prerequisites
- Module protobuf types exist in `go/types/<module>/`
- Module service area number is known (HCM=10, FIN=40, SCM=50)

## Step-by-Step Process

### Step 1: Read the new module's protobuf files
- Identify all structs (models), their exact field names/types, and enums
- Note cross-module references (fields pointing to HCM employees, FIN vendors, etc.)
- Pay close attention to actual field names — they often differ from what you'd guess (e.g., `RmaId` not `AuthorizationId`)

### Step 2: Determine phase ordering
- Group models by dependency: foundation objects first, then objects that reference them
- Typically 5-10 phases per module
- Foundation (no deps) -> Core entities -> Dependent objects -> Transactions -> Planning/Analytics

### Step 3: Add module data arrays to `data.go`
- Curated name arrays for realistic variety (category names, entity names, etc.)
- Place after existing module data with a comment header

### Step 4: Add ID slices to `store.go`
- One `[]string` per model in the `MockDataStore` struct, grouped by phase with comments
- Use module prefix for names that could collide with other modules (e.g., `SCMWarehouseIDs`, `SCMCarrierIDs`)

### Step 5: Create generator files (parallelizable)
- One file per logical group (e.g., `gen_<module>_foundation.go`, `gen_<module>_inventory.go`)
- Each file must stay under 500 lines
- Each function signature: `func generate<Models>(store *MockDataStore) []*<module>.<Model>`
  - Foundation generators with no store deps use: `func generate<Models>() []*<module>.<Model>`
- Patterns to follow:
  - Allocate slice, loop with flavorable distributions (e.g., 60% APPROVED status)
  - `createAuditInfo()` for all audit fields
  - `&erp.Money{Amount: <cents>, CurrencyCode: "USD"}` for monetary fields
  - `time.Unix()` / `.Unix()` for date fields
  - `&erp.DateRange{StartDate: ..., EndDate: ...}` for date ranges
  - Reference `store.*IDs` with modulo indexing for cross-model/cross-module links
  - ID format: `fmt.Sprintf("<prefix>-%03d", i+1)`
- These files can all be created in parallel since they have no interdependencies

### Step 6: Create phase orchestration files
- `<module>_phases.go` (and `<module>_phases<N>_<M>.go` if needed to stay under 500 lines)
- Each phase function:
  1. Calls the generator function
  2. Posts to `/erp/<serviceArea>/<ServiceName>` using `client.post()` with the `*List` wrapper type
  3. Appends returned IDs to `store.*IDs`
  4. Prints count
- ServiceName must be 10 characters or less

### Step 7: Update `main.go`
- Add phase calls after existing modules (with Printf headers)
- Add summary Printf section at the end showing key entity counts

### Step 8: Build and verify
- `go build ./tests/mocks/` and `go vet ./tests/mocks/`
- Most common error: proto field names differ from expectations — always verify against the `.pb.go` files

## Key Patterns

### Flavorable distributions
- Use proportional status assignment: e.g., first 60% get APPROVED, next 20% get IN_PROGRESS, rest cycle through remaining statuses
- Random but bounded values: `rand.Intn(max-min) + min`
- Money amounts in cents: `int64(rand.Intn(rangeSize) + minimum)`

### Cross-module references
- HCM: `EmployeeIDs`, `ManagerIDs`, `DepartmentIDs` (for managers, requesters, assignees)
- FIN: `VendorIDs` (for procurement, suppliers), `CustomerIDs` (for shipments, returns)
- Always check `len(store.*IDs) > 0` before accessing when the dependency is optional

### File naming convention
- Generator files: `gen_<module>_<group>.go`
- Phase files: `<module>_phases.go`, `<module>_phases<N>_<M>.go`
