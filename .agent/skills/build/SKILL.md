---
name: build
description: Executes tasks against the approved specifications, verifies with TypeScript/Vite builds, and syncs to Capacitor Android. Use when user says /build.
---

# /build Skill: Spec-Driven Execution & Verification

## Purpose
Turn approved specifications into working, verified code while updating tasks and syncing to Android.

## Protocol:
1. Ensure `docs/PRD.md` and `docs/TASKS.md` are aligned.
2. Implement code changes step-by-step according to `docs/RULES.md` and `docs/DESIGN.md`.
3. Run verification:
   ```bash
   npm run build
   ```
4. Sync build outputs to Android:
   ```bash
   npx cap sync
   ```
5. Check off completed items in `docs/TASKS.md` (`[x]`).
6. Record architectural changes in `docs/MEMORY.md`.
7. Present a completed summary to the user.
