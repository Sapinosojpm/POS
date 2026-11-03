# Universal POS Spec-Driven Development System (SDD)

This workspace operates under the **Spec-Driven Development (SDD)** lifecycle:
`/describe` ➔ `/clarify` ➔ `/build`

Whenever the user invokes `/describe`, `/clarify`, or `/build`, follow the strict instructions below:

---

## 1. `/describe` — Specification & Requirements Phase
When the user says `/describe <feature>` or asks to describe a feature:
1. **Never write implementation code during this phase.**
2. Focus on **WHAT** and **WHY**, not code details.
3. Update `docs/PRD.md` with:
   - Feature Title & Persona
   - User Stories (`As a... I want to... So that...`)
   - Functional Requirements
   - Acceptance Criteria (Pass/Fail conditions)
4. If the feature touches the UI, update `docs/DESIGN.md` with visual guidelines (conforming to the Restoe design tokens).
5. Output a structured summary to the user and prompt them to run `/clarify` or proceed.

---

## 2. `/clarify` — Ambiguity & Edge-Case Interrogation Phase
When the user says `/clarify` or asks to clarify a feature:
1. Scrutinize the specification in `docs/PRD.md` and `docs/ARCHITECTURE.md`.
2. Identify:
   - Hidden assumptions
   - Offline edge cases (e.g. what happens if printer runs out of paper, network drops mid-checkout)
   - Data schema conflicts or missing fields
   - Hardware constraints (tablets vs desktop PC)
3. Present 2–4 targeted clarifying questions to the user (using `ask_question` or clear numbered choices).
4. Upon user response, resolve all open ambiguities into `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/MEMORY.md`.

---

## 3. `/build` — Execution, Verification & Sync Phase
When the user says `/build` or asks to build the specified feature:
1. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, and `docs/RULES.md`.
2. Break the implementation down into granular tasks in `docs/TASKS.md` with `[ ]` checkboxes.
3. Execute the code changes step-by-step.
4. Verify the build by executing:
   ```bash
   npm run build
   ```
5. Sync the web assets to the native Android project:
   ```bash
   npx cap sync
   ```
6. Mark completed items in `docs/TASKS.md` as `[x]` and log decisions in `docs/MEMORY.md`.
7. Present a concise verification report to the user.
