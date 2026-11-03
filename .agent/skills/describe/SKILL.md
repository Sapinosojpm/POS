---
name: describe
description: Drafts or updates product specifications and requirements in docs/PRD.md before any code is written. Use when user says /describe or wants to plan a new capability.
---

# /describe Skill: Requirements & Spec Drafting

## Purpose
Translate user feature requests into formal specifications in `docs/PRD.md` and `docs/DESIGN.md` without jumping prematurely into code.

## Protocol:
1. Parse the requested feature from the user input.
2. Update `docs/PRD.md` under a new or updated section:
   - **Feature Overview**: What problem it solves.
   - **Target Persona**: Who uses it (Solo Cashier, Manager, Owner).
   - **Acceptance Criteria**: Verifiable checklist of requirements.
3. If UI is involved, update `docs/DESIGN.md` ensuring it respects Restoe tokens (blue accent, crisp `rounded-lg` borders).
4. Do NOT modify source code files during this step.
5. End by offering to run `/clarify` on the new spec.
