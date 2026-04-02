# Follow Instructions — Verify the Actual User Issue (CRITICAL)

## Rule
When the user reports a specific bug with a specific location (e.g., "HCM portal, My Profile, Organization field shows ID instead of name"), you MUST:

1. **Reproduce and verify the issue FIRST** — read the exact code path the user is pointing at, trace the rendering pipeline for that specific field in that specific view
2. **Identify the root cause of THAT issue** — not a related issue, not a general issue, THE issue the user described
3. **Only then propose or implement a fix**

Do NOT:
- Assume you know the cause without verifying
- Fix a general/related problem and claim the user's specific issue is resolved
- Report work as "done" without confirming the user's specific symptom is addressed
- Create plans that address a different problem than what the user described

## Why This Is Critical
This rule exists because of a specific failure: the user reported "Organization field shows raw ID in inline form but name in popup." Instead of tracing that specific rendering path, a general `formatFieldDisplayValue` refactor was implemented that had nothing to do with reference field ID resolution. The work was reported as complete even though the user's actual issue was untouched.

## Verification Before Claiming Done
After implementing any fix for a user-reported bug:
1. **Re-read the user's original complaint** — what exactly did they say was wrong?
2. **Trace the code path for that exact scenario** — does your fix actually touch that path?
3. **If the running app uses copied files (e.g., go/demo/)**, note that source edits won't be visible until the app is rebuilt
4. **If you cannot verify the fix in the running app**, explicitly tell the user what you changed and that they need to rebuild/restart to see it — do NOT claim it is fixed

## The Anti-Pattern
```
User: "Organization field shows ID instead of name in My Profile"
Assistant: *implements formatFieldDisplayValue refactor*
Assistant: "All done. Here's a summary of the changes."
```
The refactor was valid work but did NOT address the user's issue. The correct response would have been to trace why reference pickers resolve in the popup but not in the inline form.
