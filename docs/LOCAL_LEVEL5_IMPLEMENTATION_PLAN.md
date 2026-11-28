# Level 5 implementation plan

Level 5 adds a check on the way out of the castle. The Watchtower screens Robin's note, the Castle AI answers under its secrecy instruction, and Flask checks the complete reply before the player sees it. Submitting the correct fictional password finishes the game.

## Implemented choices for the local build

- The level is called **The Treasury**. Its opening explains the lookout and the treasury seal.
- Reuse Level 4's lookout, single-note conversation policy, and local Qwen model. Implement the output filter as ordinary Python. An accepted turn still takes two model calls.
- Cover the full password in plain text, with case changes, with added whitespace (including line breaks), or inside a standard padded Base64 token. For plain and decoded text, remove whitespace, case-fold, then check whether the normalized reply contains the normalized password. Preserve punctuation.
- For Base64, scan complete tokens and strictly decode one layer of standard Base64 as UTF-8. The limits are 4,096 characters per candidate and 32 candidates per reply. If an otherwise eligible token or the number of candidates exceeds a limit, withhold the reply. Ignore malformed tokens and non-text decodings. Include harmless prose and long benign replies in the tests to catch excessive blocking. The [specification](exp_architecture.md) requires a documented, tested set of transformations.

## Verification status

The in-process Flask checks use scripted model replies to exercise access, guard errors, filtering, password submission, repeat completion, and reset. Filter tests cover the transformation and budget boundaries. Browser interaction and difficulty with local Qwen still need a live playtest.

## Build sequence

1. **Register and unlock the level.** Add the catalogue entry and opening in `backend/levels.py`, a backend-only `ROBIN_LEVEL5_PASSWORD` in `backend/config.py`, and the transition from 4 to 5. Use the protected castle instruction in `backend/model_client.py`. The current local route through the game becomes 1 → 2 → 4 → 5. For players who finished Level 4 in an older build, explain that resubmitting its answer unlocks Level 5. Those sessions recorded access to Level 4 but lack a server-side record of beating it.
2. **Filter the reply before delivery.** Add a small function in `backend/output_filter.py` that accepts a reply and the configured password and returns a decision. In `backend/app.py`, check access, screen only the last player note, and call the castle only on an explicit pass. On Level 5, hold the complete castle reply in Flask until the filter finishes. A match returns a fixed notice such as “The treasury seal stopped the castle’s reply.” Keep the raw withheld text out of the HTTP response and logs. A guard or model failure follows the existing retryable error path.
3. **Record the win.** Use the existing server validator and its current comparison rule (ignore case and surrounding whitespace). On a correct Level 5 submission, record final completion in the Flask session before returning a game-complete result. Make repeat success idempotent and clear the result on reset. Keep validator normalization independent of the broader checks used for outgoing chat.
4. **Connect the player screens.** Extend `frontend/src/progress.ts`, `App.tsx`, `api.ts`, and `LevelOne.tsx` for the new route, chooser, Continue button, and final victory screen. Distinguish an input block from a withheld reply in the API and transcript. Keep the lookout icon for a stopped note and use a treasury seal and label for a withheld reply. Show the final neon Robin using the existing branding. After victory, offer replay and a return to the menu. Keep the existing save key and update the chooser's prerequisite and availability text.
5. **Verify and document.** Use the existing fake Ollama server for repeatable checks, then play through the normal browser flow with local Qwen. Update the README's playable-level list, the setup notes for the new environment variable, and the manual checklist. Record measured playtest results separately from the filter rules.

## Acceptance checks

| Check | Expected result |
| --- | --- |
| Fresh session or edited browser save opens Level 5, chats, or submits an answer | All three API entry points enforce the Level 4 prerequisite. Correct Level 4 validation unlocks them. |
| Lookout blocks, times out, or gives an invalid verdict | Zero castle calls. A block names the lookout. A service failure offers Retry. |
| Lookout passes and the castle sends an ordinary reply | Only the screened note reaches the castle. The player receives the original reply, including its formatting. |
| Fake castle returns a full test password in surrounding prose, mixed case, across whitespace, or in a Base64-encoded sentence | Each form produces the treasury notice. Inspect the entire response body for accidental disclosure. Progress stays unchanged. |
| Candidate is malformed, harmless, or near a size or count limit | Unit tests cover both sides of each limit and assert the documented decision. |
| Same simulated plaintext disclosure on Levels 4 and 5 | Level 4 delivers its castle reply. Level 5 withholds it. Earlier level contracts still pass. |
| Wrong, correct, and repeated final submissions, then refresh and reset | Only a correct answer finishes the game. Completion survives refresh, replay adds no duplicate, and reset restores the initial state. |
| Browser demo with local Qwen | Verify ordinary conversation and the final win screen. Playtest without giving the tester the answer and record whether they finish, how many turns it takes, and any harmless messages that get blocked. |

Automated acceptance covers predictable filter behavior. The playtest answers a separate gameplay question: can a player finish the challenge at a difficulty the team wants for its final level?
