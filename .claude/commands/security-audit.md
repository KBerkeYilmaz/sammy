---
description: Run the security auditor agent against recent changes
---

Use the security-auditor agent to review the current codebase for vulnerabilities.

Focus on files changed recently (check git diff if available), or audit the entire `src/` directory.

After the audit, provide a prioritized list of findings by severity. If no issues are found, confirm that the reviewed code appears secure.
