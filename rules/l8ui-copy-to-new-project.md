# Add l8ui Library to New Projects (CRITICAL)

## Rule
Before implementing ANY UI in a new project, you MUST add the `l8ui` library as a git submodule under the project's `web/` directory. Never copy l8ui manually from another project or reference it via relative paths.

## How It Works
The `l8ui` project contains a script called `setup-l8ui-submodule.sh`. This script sets up l8ui as a git submodule under the `web/` directory of the new project.

## Steps
1. **Copy the setup script** from the l8ui project into the new project's `web/` directory:
   ```bash
   cp <path-to-l8ui>/setup-l8ui-submodule.sh <new-project>/go/<project>/ui/web/
   ```
2. **Run the script** from the `web/` directory:
   ```bash
   cd <new-project>/go/<project>/ui/web/
   ./setup-l8ui-submodule.sh
   ```
3. **Create project-specific files** (nav configs, reference registries) inside the new project — never reference another project's files
4. **Update all HTML paths** to use `../l8ui/` relative to the project's own web directory

## What NOT to Do
- Do NOT `cp -r` the l8ui directory from l8erp or any other project
- Do NOT use `../l8erp/...` or `../erp-ui/...` paths in HTML files
- Do NOT symlink to another project's l8ui
- Do NOT skip this step and "reference it later"

## When to Do This
At the very start of UI implementation — before creating any `app.html`, section HTML, or module JS files.
