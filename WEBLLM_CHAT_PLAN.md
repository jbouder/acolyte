# WebLLM Floating Assistant Plan

## Phase 1 — Foundation and embedded context

- [x] Add the audited WebLLM browser-runtime dependency.
- [x] Define the small, text-only tool catalog the assistant may describe or invoke.
- [x] Generate the assistant's embedded tool context during builds so CI keeps it current.

## Phase 2 — Floating local assistant

- [ ] Add an accessible, globally available floating chat panel.
- [ ] Load a user-selected WebLLM model in the browser and show download progress, availability, and errors.
- [ ] Send bounded conversation history plus the embedded Acolyte context to the local model.

## Phase 3 — Safe natural-language actions

- [ ] Let the model choose from explicit, allowlisted text-only actions.
- [ ] Execute JSON formatting/validation, Base64 encoding/decoding, and tool discovery locally.
- [ ] Return action results to the conversation without navigating, submitting requests, or accessing stored user data.

## Phase 4 — Verification

- [ ] Add focused assistant and tool-action tests.
- [ ] Run formatting, linting, tests, build, secret scanning, and CodeQL.
