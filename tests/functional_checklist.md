# Functional checks in your usual browser

Use the running app at http://127.0.0.1:5173. Start the backend and Ollama as described in the project README. Use your existing browser; nothing extra needs to be installed.

These cases preserve the requirements of the former 25 browser automation tests. They are manual checks, not automated passes. Record PASS, FAIL or BLOCKED, plus a short note, for each. The Node tests cover save parsing/storage and API transport only; they do not exercise the React UI.

## Everyday gameplay

| Case | Action | Expected result |
|---|---|---|
| F01 | Reset progress. Open the menu, chooser, Level 1 and return to the menu. | Title and Start game appear; five levels are visible, only Level 1 is playable. Back to menu works. |
| F02 | Start Level 1, refresh, return to menu, refresh and choose Continue. | Level 1 resumes. It is not marked completed. |
| F03 | Complete Level 1. Close and reopen the browser with the same profile; open the chooser. | Continue appears; Level 1 says Completed and can be replayed. Levels 2-5 stay locked. |
| F04 | Open `/level/1` directly and refresh. | Level 1 remains usable. |
| F05 | Visit `/level/2`, `/level/3`, `/level/4`, `/level/5`, `/level/0`, `/level/-1`, `/level/999` and `/level/garbage`, then refresh. Repeat after completing Level 1. | Locked or unsupported routes offer menu navigation. After completing Level 1, Level 2 opens. |
| F10 | On completed progress, open Reset progress, Cancel, then open it again and confirm. | Cancel preserves progress. Confirmation restores Start game, including after refresh. Other site-storage keys remain untouched. |
| F11 | Choose Continue after completion. | Continue opens the next unlocked, unfinished level. After final victory, View victory opens the ending. |
| F12 | Read the opening and send a message. | Opening: “Welcome to the castle stores. What would you like to know?” Player messages say Robin (you) with Robin's face; replies say Castle AI with a tower avatar. |
| F13 | Try whitespace-only input, then two lines using Shift+Enter, then Enter. | Blank text is not sent. Shift+Enter inserts a newline. Enter sends the multiline text once. |
| F14 | While awaiting a reply, repeatedly press Enter/click Send. | Waiting state appears; Send is disabled; only one user message/request is created. Check the browser Network panel if unsure. |
| F15 | Ask for the password. Do not submit it. Refresh and revisit the chooser. | Chat disclosure does not fill/submit the password form or complete/unlock anything. |
| F16 | Submit a wrong guess, then the correct password with surrounding spaces and changed case. | Wrong guess shows feedback. Correct guess shows resources recovered for villagers, Replay Level 1 and menu navigation; Play Level 2 opens the Guarded Gate. |
| F17 | Submit a password with network throttling enabled in your browser developer tools. | Submit password is disabled while pending; completion appears only after a successful validator response. Review `LevelOne.tsx` if needed to confirm the UI uses the returned booleans, not a local password comparison. |
| F18 | After a conversation and completion, choose Replay Level 1. | Only the fresh greeting remains; both inputs are empty; prior completion is retained. The next chat request contains no previous attempt history. |
| F19 | Stop Ollama, send a message, then restart Ollama and select Retry. | Clear service error, retained text, no fabricated reply. Retry produces one reply without duplicating the user bubble; its request payload matches the failed one. |
| F20 | Stop the backend while the UI is open. Send a message, restart the backend and retry. Repeat the outage while submitting a password. | Chat recovers. Failed validation never completes the level, retains the guess and re-enables Submit password. |
| F21 | Tell the castle to remember a basket of apples; ask about it. | Follow-up request includes the previous user/assistant exchange in order; response normally uses that context. |
| F22 | Build a long conversation. At the bottom, send a message. Then send another and scroll to older messages while waiting. | New replies follow the bottom when reading there. A reply does not pull you away from older messages. |
| F23 | Send a message, immediately return to the menu and Continue. | New attempt has usable controls, no stale waiting state, and no late message or validation result from the old attempt. |
| F24 | Try 1440px, 390px and 320px viewport widths, long unbroken text and 200% zoom. | Inputs/buttons remain usable and reachable; no page-wide horizontal overflow. Both forms show readable feedback. |
| F25 | Send `<img src=x onerror="window.unexpectedScript = true">`. Inspect the bubble and, if needed, evaluate `window.unexpectedScript` in developer tools. | It appears as literal text, with no injected image or executed handler. Model replies also render as text: review the JSX expression in `LevelOne.tsx` if the model does not echo the payload. |

## The Treasury

| Action | Expected result |
| --- | --- |
| Visit `/level/5` before and after completing Level 4. | The locked page names the Watchtower prerequisite. Correct Level 4 submission opens the Treasury. |
| Send an ordinary note. Compare an input block and a withheld reply using controlled model responses. | A passed reply keeps its formatting. A stopped note shows the lookout. A withheld reply shows the treasury seal and its fixed notice. |
| Submit a wrong answer, then the correct one. Refresh, replay, and return to the menu. | Only the correct answer reveals neon Robin. Refresh and View victory restore the ending. Replay starts a fresh Treasury conversation. |
| Reset progress. | Victory clears and Level 5 locks again. |

## Save recovery checks

Use developer tools on this game's origin only. Inspect/edit the key `robin-hoodie.progress.v1` under local storage. Restore progress with Reset progress afterwards. Do not clear all browser data.

| Case | Action | Expected result |
|---|---|---|
| F06 | Set the save to the forged JSON below, refresh, use the chooser and Continue. | Only Level 1 is available. The save parser drops unsupported level IDs and the unlock list. Server access and the final victory state still come from the session. |
| F07 | Replace the save with `{broken`, `null`, `[]`, `42`, or JSON with version 999, started set to the string `"true"`, completedLevels set to `"all"`, or currentLevel set to boolean `true`. Refresh after each. | App remains usable; starting Level 1 writes valid, uncompleted progress. |
| F08 | Block site storage in your normal browser's privacy settings, then start/chat/complete Level 1. If that browser cannot block local storage independently, mark this case BLOCKED. | Gameplay still works in memory; a save warning explains the limitation. |
| F09 | Simulate a write failure using the snippet below before starting/completing Level 1. Refresh afterwards to restore the normal Storage implementation. | Successful backend validation still shows completion and a save warning. |

Forged save for F06:

```json
{"version":1,"started":true,"currentLevel":5,"completedLevels":[1,2,3,4,5],"unlockedLevels":[1,2,3,4,5]}
```

Write-failure simulation for F09 (developer-tools console, game tab only):

```javascript
Storage.prototype.setItem = function () {
  throw new DOMException('Storage full', 'QuotaExceededError');
};
```

For F10's unrelated-key check, set `unrelated-setting` to `keep` in the same storage panel before resetting. It must still exist afterwards.

For broader art, model provenance, README and scope review, use [manual_acceptance.md](manual_acceptance.md). Browser rendering and interactions must be marked unverified until somebody performs them.
