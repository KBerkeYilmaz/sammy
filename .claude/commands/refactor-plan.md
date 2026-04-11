---
description: Analyze code and produce a refactor plan before making changes
argument-hint: path/to/file-or-directory
---

Analyze "$ARGUMENTS" and produce a refactor plan **without making any changes yet**.

**Steps:**
1. Read the target files thoroughly
2. Identify:
   - Code duplication
   - Performance issues
   - TypeScript improvements
   - Architectural inconsistencies with Forge conventions
   - Missing abstractions or over-engineering
3. Produce a prioritized list of proposed changes, each with:
   - What to change and why
   - Risk level (Low / Medium / High)
   - Estimated scope (lines affected)
4. Ask the user which items to proceed with before touching any code
