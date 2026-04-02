# login.json Must Be Adapted When Copied

## Rule
When `login.json` is copied from l8erp (or any other project) to a new project, it MUST be immediately adjusted. Do NOT leave the l8erp defaults in place.

## Fields to Update

| Field | l8erp Default | What to Change To |
|-------|--------------|-------------------|
| `login.appTitle` | `"ERP by Layer 8"` | Project name (e.g., `"L8ID"`, `"L8Bugs"`) |
| `login.appDescription` | `"Enterprise Resource Planning"` | Project description |
| `app.apiPrefix` | `"/erp"` | Project's PREFIX constant (e.g., `"/l8id"`, `"/bugs"`) |

## Why This Is Critical
The `apiPrefix` field is read by the l8ui shared components (`layer8d-config.js`) to construct ALL API URLs. If it remains `"/erp"`, every API call from the UI will hit `/erp/...` instead of the project's actual prefix (e.g., `/l8id/...`), causing 404 errors on every request.

## Where to Find the Correct apiPrefix
Check the project's `common/defaults.go` for the `PREFIX` constant:
```bash
grep "PREFIX" go/<project>/common/defaults.go
```

## Verification
After copying login.json:
```bash
grep "apiPrefix" go/<project>/ui/web/login.json
# Must NOT contain "/erp"
grep "appTitle" go/<project>/ui/web/login.json
# Must NOT contain "ERP by Layer 8"
```
