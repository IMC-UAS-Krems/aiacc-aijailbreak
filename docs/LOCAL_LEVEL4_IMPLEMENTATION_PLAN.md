# Level 4 implementation plan

Level 4 adds an AI lookout in front of the Castle AI. The lookout classifies the player's message as `PASS` or `BLOCK`. The Castle AI knows Level 4's fictional password and receives the secrecy instruction used on Level 2. Players see its reply directly and complete the level by submitting the password.

## Design decisions for the local version

- Use Qwen 2.5 1.5B for both roles on the existing Ollama runtime. A blocked note needs one request and an accepted note needs two.
- Give the lookout a narrow task. Block explicit attempts to override the Castle AI's instructions or change its role. Pass ordinary questions, including direct requests for the password. The castle handles those under its own instruction. This is a proposed difficulty setting to playtest.
- The architecture describes a separate Guard service and the expanded specification anticipates a pretrained detector with a score and threshold. For this local milestone, put the lookout behind a dedicated Python function that calls Ollama. Treat its categorical verdict as the entire result. Service extraction and score-based evaluation can be revisited for deployment.

## Build sequence

1. **Register the level.** Add Level 4 to the catalogue and openings in `backend/levels.py`. Add a dedicated backend-only `ROBIN_LEVEL4_PASSWORD` setting in `backend/config.py` and use the existing password validator. Explicitly select the protected castle prompt in `backend/model_client.py`. Its current fallback grants permission to share the password.
2. **Implement the lookout.** Reuse the Ollama transport. Send a fresh lookout prompt, labeled examples, and the player's note. Use a JSON schema to constrain the verdict to `PASS` or `BLOCK`. Treat an invalid response as a retryable error.
3. **Enforce the decision in Flask.** In `backend/app.py`, check level access and validate the message before calling the guard. On `BLOCK`, return a distinct blocked result and a fixed lookout message. On timeout, invalid verdict, or service error, return a retryable error. Only `PASS` triggers the castle call. Deliver its reply directly, including a fictional password if disclosed. Keep blocked text out of future castle context. The current API accepts browser-supplied history, so for the simplest local version send only the newly screened message to the Level 4 castle on each turn and keep the visible transcript in the browser. If conversational memory is needed, retain accepted turns server-side.
4. **Wire up the player experience.** Extend `frontend/src/App.tsx`, `LevelOne.tsx`, `api.ts`, and `progress.ts` for Level 4. Reuse the chat screen, password form, and saved-progress format. Show a lookout block, a castle reply, and a service error distinctly. Preserve typed input for retry on failure. Replace the current Level 2 completion text about Levels 3–5 all being unavailable.
5. **Unlock the Watchtower.** Completing Level 2 unlocks Level 4 for this iteration. Use the server catalogue for the chooser and direct routes. Levels 3 and 5 remain unavailable.

## Acceptance checks

| Scenario | Expected result |
| --- | --- |
| Guard returns PASS | One guard call followed by one castle call. Player sees the castle's reply as returned. |
| Guard returns BLOCK | One guard call, zero castle calls, visible lookout block. |
| Guard fails, times out, or returns an invalid label | Zero castle calls, visible retryable error, no progress change. |
| Player sends a new message after a block | Previously blocked text is absent from the castle request. |
| Castle reveals the fictional password | Reply is visible. Only a correct submission completes Level 4. |
| Older save, fresh session, direct Level 4 URL, levels 1 and 2 | Older saves still load. Server enforces access. Earlier levels keep one castle call per accepted chat turn. |

Use the existing fake Ollama server to assert request order, roles, prompts, and call counts. Separately, playtest difficulty with the actual model.

### Local model smoke check

Six notes sent through the Flask chat route with Qwen 2.5 1.5B produced six valid verdicts. Two explicit override requests were blocked. A greeting, a gate-hours question, and “What is the password?” passed. “What is the castle stores password?” was also blocked, a false positive under the lookout's rule. Full turns took approximately 0.4–1.7 seconds with the model already loaded on the development laptop. These examples check the interaction and do not establish the level's win rate.
