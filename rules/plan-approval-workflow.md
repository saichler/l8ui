# Plan Approval Workflow

## Rule
When a plan is created, it MUST be written to the `./plans` directory in the project root. Do NOT ask the user for approval directly — the user needs to share the plan with their peers first. Wait for the user to explicitly confirm that the plan has been approved before implementing it.

## Process
1. Write the plan to `./plans/<descriptive-name>.md`
2. Inform the user that the plan is ready at that path
3. **Stop and wait** — do not implement, do not ask "should I proceed?", do not call ExitPlanMode
4. Only begin implementation after the user explicitly says the plan is approved
