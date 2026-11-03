---
name: clarify
description: Interrogates specifications to discover edge cases, resolve ambiguities, and clarify requirements before execution. Use when user says /clarify.
---

# /clarify Skill: Specification Interrogation & Alignment

## Purpose
Examine `docs/PRD.md` and `docs/ARCHITECTURE.md` to identify missing requirements, race conditions, offline failure modes, and hardware conflicts before any code is built.

## Protocol:
1. Review the latest specs drafted in `docs/PRD.md`.
2. Generate 2 to 4 high-value questions focusing on:
   - **Offline Resilience**: What happens if the tablet is offline or disconnected?
   - **Hardware Edge Cases**: Thermal printer errors, scanner timeouts.
   - **Data Conflicts**: Duplicate inputs, multi-terminal reconciliation.
3. Use the `ask_question` tool or concise multiple-choice options to ask the user.
4. Update `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/MEMORY.md` with the finalized decisions.
