# Robin Hoodie: AI and Development Guide

Prepared October 31, 2026. Submission deadline: **December 4, 2026**.

This guide is for every teammate and coding assistant working on Robin Hoodie. It records the proposed delivery plan and shared working practices from the planning discussion. It does not claim that tools are installed, code is implemented, milestones are complete, or all recommendations have been accepted by the team.

## 1. Project context and decision status

Robin Hoodie is a web game where players try to recover a fictional password from an AI model. Players must submit the password to a backend validator to complete each level. The project also demonstrates architecture, service communication, Kubernetes deployment, CI/CD, monitoring, and carbon-aware behavior.

The team has three members: one with some development experience and two beginners. Weekly availability varies because of other assignments. Plan around demonstrable milestones and revise weekly commitments to match actual capacity.

### Confirmed context and existing directions

- Submission is December 4, 2026; the exact submission time and platform still need confirmation.
- Python is confirmed for the backend.
- Existing architecture decisions separate the Game API, Guard service, and LLM service, with game rules kept in the Game API.
- Postgres is the accepted persistence direction; local Kubernetes is the accepted deployment direction.
- Five levels, manual password submission, and level-specific defenses are central to the design.

### Recommendations that still need team agreement

- FastAPI; React with TypeScript and Vite; a consistent UI library such as Mantine.
- Anonymous sessions unless accounts are required.
- One primary model first, with controlled failures; add a second model only when required or justified.
- One shared repository and small reviewed contributions.
- One carbon-aware action: defer optional background evaluations with a maximum delay.
- The responsibility split and milestone dates below.

The detailed specification includes fallback-related scope, while the first-iteration architecture permits an approved fallback or a controlled error. Confirm the rubric and record the intended implementation before removing or committing to a second model. Do not treat this guide as permission to drop an assessment requirement.

Read the [first-iteration architecture](outputs/architecture.md) and [detailed specification](outputs/Robin_Hoodie_Project_Specification.md) for technical requirements. Resolve meaningful differences explicitly and update affected documents together. Instructor requirements and confirmed team decisions should be recorded rather than left only in chat.

## 2. Where the work happens

| Tool or place | Purpose |
|---|---|
| Codex desktop app | Plan focused changes, edit project files, run checks, investigate defects, and review code. |
| VS Code | Read and understand code, inspect changes, make manual edits, and use the terminal. |
| Codex extension in VS Code, optional | Use the assistant beside the code if preferred. Installing both interfaces is not necessary. |
| Browser | Play the game, check layout and accessibility, and reproduce defects. |
| GitHub or university GitLab | Share code, track tasks, review changes, and run automatic checks. |
| ChatGPT, optional | Research, explanations, report feedback, and presentation practice. Save important decisions back into the repository. |

Suggested starting arrangement: open the same project folder in Codex and VS Code, with the game open in a browser. Use one AI editing task per working copy at a time. Independent simultaneous editing needs separate working copies or worktrees and an integration plan.

There are two distinct AI setups:

1. **Development assistant:** Codex helps the team create and maintain the project.
2. **Game models:** the backend calls the protected model and guard selected for Robin Hoodie. Their access, credentials, compute requirements, and budget must be configured separately.

Opening the project folder lets a local coding assistant inspect relevant files within its permissions. There is no need to repeatedly upload the entire repository. Other assistants may need an explicit instruction to read AGENTS.md and this guide. Repository access does not automatically share private chats or AI subscriptions.

## 3. Initial setup and onboarding

Check what is already installed before downloading anything. Agree on compatible versions and document them for every teammate. Choose one documented environment approach rather than mixing Windows and WSL paths or interpreters accidentally.

| Item | Why it is needed | When |
|---|---|---|
| VS Code | Inspect and edit the project. | Beginning |
| Git | Track changes, create branches, and collaborate. | Beginning |
| Supported Python version | Run backend services and evaluations. | Beginning |
| Compatible Node.js LTS and npm | Run frontend development and build tools. | Beginning |
| Codex access | AI-assisted development. | Beginning |
| Shared repository and accounts | Team collaboration and automated checks. | Beginning |
| Docker Desktop or an agreed equivalent | Run the database and containerized services. | Database milestone |
| One local Kubernetes option and its tools | Demonstrate the required deployment. | Early deployment trial |
| Model access and scoped credentials | Run real-model experiments and gameplay. | Early model trial |

Docker on Windows may require WSL 2 and virtualization setup. Check the machine requirements before choosing the deployment approach. Avoid downloading large local models before confirming hardware capacity.

FastAPI, React, and testing libraries are installed as project dependencies. The assistant can prepare isolated Python environments, package configuration, example environment variables, and startup scripts. The team handles sign-ins, accounts, system prompts, and university permissions as needed.

### Onboarding checklist for each person

- [ ] Read the assignment rubric, this guide, and the relevant architecture sections.
- [ ] Obtain repository access and make a personal local checkout.
- [ ] Install or verify the agreed development tools.
- [ ] Configure local credentials without committing them.
- [ ] Start the starter application and run its documented checks.
- [ ] Make one small contribution on a branch and complete a review with a teammate.
- [ ] Explain the contribution and reproduce its behavior without depending on the original AI chat.

Add verified setup, startup, test, and deployment commands to README.md when they exist. A successful setup means another teammate can follow the instructions, not just that the author's machine works.

## 4. What context to give AI

At the start, provide the specification, grading rubric, deadline, team capacity, accepted decisions, relevant instructor feedback, and a few visual references with explanations.

Keep durable information in the shared repository or issue tracker:

| Location | Information |
|---|---|
| README.md | Verified installation, startup, testing, and demonstration instructions. |
| AGENTS.md | Short instructions for coding assistants and links to relevant documents. |
| This guide | Delivery roadmap, collaboration, review, and completion practices. |
| Architecture and specification | Required behavior, service boundaries, diagrams, and decision status. |
| Issues or an agreed task board | Current task, owner, reviewer, acceptance criteria, and status. |
| Evaluation records | Test cases, model configuration, measurements, limitations, and reproducible commands. |

For individual tasks, supply the expected outcome and relevant evidence: exact error text, reproduction steps, screenshots for visual issues, and the task or issue reference. Point to existing files instead of pasting stale copies of code.

Do not give AI real credentials in prompts or screenshots. Keep local secret configuration out of version control and provide an example file with placeholders. Do not attach unnecessary private player content.

At a new chat, identify the current task and branch, link to the relevant documents, and describe unresolved issues. Do not assume another assistant knows earlier conversations. Material decisions belong in shared files or issues.

## 5. Milestone roadmap

All dates below are in **2026**, using the team's Europe/Budapest time context. These are planning targets, not completed milestones. Confirm each week's capacity before assigning work.

| Dates | Focus | Exit evidence |
|---|---|---|
| October 31-November 6 | Agree scope, onboard everyone, create repository, choose basic visual direction, and test model access. | Everyone can start the project. A basic screen sends a prompt through the backend and displays a model response. |
| November 7-13 | Complete one level and establish the development workflow. | Chat, password submission, unlocking, and persistent progress work. Basic automatic checks run. Attempt a minimal Kubernetes deployment and record issues. |
| November 14-20 | Complete the required implementation. | All five levels, guard/filter behavior, sessions/reset rules, limits, errors, required deployment, monitoring, and carbon action are demonstrable. |
| November 21-27 | Evaluate, playtest, repair, and document. | Recorded defense and performance results; serious defects fixed; a full report draft and reproducible deployment instructions. |
| November 28-December 3 | Stabilize, verify the submission, and rehearse. | Fresh installation succeeds; release is tagged; report and slides are final; everyone can explain their contribution. |
| December 4 | Submit and verify receipt. | Correct files, release version, and accessible links submitted before the confirmed cutoff. |

Use **November 20 as the feature cutoff**. After that, prioritize fixes, measurement, documentation, and missing assessment requirements. Keep roughly the final fifth of available time for completion work.

Begin documentation and CI early. After the first playable level, trial Kubernetes rather than leaving deployment discovery to the end. Develop remaining requirements in small increments; do not leave all integration to one final merge.

### Scope controls

- Prefer anonymous sessions if accounts are not required.
- Keep level configuration in files and use one interface component library.
- Keep accepted service boundaries and one shared repository.
- Demonstrate local Kubernetes and document a cloud target; actual cloud deployment depends on course requirements and capacity.
- Clarify fallback requirements early. Establish a reliable primary model before adding a second one.
- Demonstrate one carbon-aware action, including high, low, and unavailable intensity cases.
- Keep leaderboards, achievements, live feeds, brokers, and an admin interface outside the initial scope.

### Recovery checkpoints

| Warning sign | Response |
|---|---|
| Setup still blocks teammates after week one. | Hold a shared setup session and repair onboarding instructions before assigning more dependent work. |
| No complete playable level by November 13. | Pause extra levels and finish the complete player journey together. |
| Required behavior is incomplete on November 20. | Drop optional work and order remaining tasks against the rubric. Record any unresolved delivery risk. |
| Significant problems remain on November 27. | Freeze cosmetic changes and focus on a reliable demo, essential fixes, and honest documentation. |

## 6. Team responsibilities and collaboration

These roles are proposed; assign actual names in the task tracker at kickoff.

| Role | Primary ownership | First contribution |
|---|---|---|
| Contributor A: some development experience | Backend structure, model integration, shared interfaces, and integration review. | Make one prompt travel from the interface through the backend to the model. |
| Contributor B: beginner | Interface, visual consistency, usability, and browser checks. | Build the level selector and chat layout using example data. |
| Contributor C: beginner | Evaluation cases, level configuration, automated checks, and deployment documentation. | Create a labelled prompt set and a small repeatable evaluation script with AI assistance. |
| Everyone | Reviews, deployment practice, report, and demonstration. | Run another teammate's contribution and explain its behavior. |

Start deployment as a shared activity with Contributor A. Rotate reviews and learning opportunities; beginners should contribute working behavior, not only documentation. Avoid making one person the sole reviewer or the only person able to operate the application.

Use short-lived branches and pull requests (or GitLab merge requests). A branch keeps a contribution separate until it is reviewed; a pull request presents the changes for review and merging.

Every task has an owner and reviewer. Agree on request/response formats before independently building the frontend, backend, guard, and LLM integration. Coordinate changes to shared interfaces and database structures. Keep contributions small, merge regularly, and preserve a runnable shared version.

The author demonstrates the result and explains the code before review. Teammates can review interface behavior, test cases, and documentation even while learning the backend. AI review supplements human review and reproducible checks.

## 7. The development loop

1. Choose one concrete task and describe observable success, including important failure behavior.
2. Start from an up-to-date branch and inspect existing changes before editing.
3. Give the assistant the task and relevant context. Resolve consequential ambiguity while continuing independent work where possible.
4. Let it implement the change using existing conventions and run relevant checks.
5. Read the changes and explanation. Ask about anything you cannot explain.
6. Try the affected player journey in the browser, including relevant failures.
7. Have a teammate review the contribution, then merge after the agreed checks pass.
8. Update the task and any affected setup or design documentation.

Build interface behavior with predictable fake model responses, then connect a real model early. Retain fake responses for routine checks. Use separate real-model evaluations for defense quality, with an agreed call budget and configuration.

A feature is done when its acceptance criteria are demonstrated, relevant checks pass, significant review findings are resolved, and the author can explain the result. If a check could not run, record that limitation rather than treating it as a pass.

### Example implementation request

> Implement server-side password validation for the current level, following the project specification and repository instructions. Incorrect passwords must not change progress. Correct submissions must persist completion and unlock the next level. Repeated correct submissions must not duplicate progress, and a save failure must not display success. Inspect the existing code, implement the change, run relevant checks, and explain how I can verify it in the browser. Identify unresolved specification questions.

### Example debugging request

> Reproduce this issue using the steps and error text below. Explain the cause, make a focused fix, and verify the affected behavior. Preserve unrelated work. Report anything you could not test.

### Example review request

> Review this contribution against its acceptance criteria and the relevant architecture rules. Look for incorrect behavior, missing failure handling, and regressions. Report actionable findings with file references. Do not edit code during this review. Explain any limits to the review.

### Example session handoff request

> Summarize completed changes, checks actually run and their outcomes, unresolved issues, decisions needing documentation, and the next concrete task. Update the relevant shared task or document within the requested scope so a teammate can continue without this chat.

## 8. Review and learning rhythm

| Review | Purpose |
|---|---|
| End of a work session | Record changes, verification, remaining problems, and the next task. Save a Git checkpoint where appropriate. |
| Weekly planning | State actual availability; assign one essential deliverable per person with a reviewer. Keep extra tasks optional. |
| Weekly working demo | Run the current application, discuss blockers and model usage, and revise scope or priorities. |
| Milestone review | Compare working behavior and evidence with the specification and rubric; have someone other than the author test it. |

Ask AI to explain unfamiliar code, trace one request through the system, and quiz contributors on their changes. Each contributor must be able to explain the work they submit. A fresh AI review is useful but is not proof of correctness.

## 9. Verification and evaluation

Preserve the important game boundaries:

- Guard calls occur only on levels 4 and 5; guard failures stop those requests before generation.
- Output filters apply only on levels 3 and 5. Replies are checked before reaching the browser on filtered levels.
- Leak detection does not complete a level; only successful server-side validation does.
- Incorrect guesses do not unlock progress; repeated correct guesses do not duplicate changes.
- Saving progress must succeed before success is confirmed.
- Sessions are isolated, and unavailable services produce understandable errors.
- Real credentials never appear in browser code, logs, or the repository.

Test game logic independently of model randomness. Add a browser check for the full level journey and test persistence across restarts. Verify reset and chat-history rules once the team defines them.

For real-model evaluation, keep development cases separate from the final evaluation set. Record model identity/version where available, instructions, generation settings, trial count, prompt cases, and the application version. Repeat trials to account for variability. Distinguish guard recall from complete-system attack success, and raw detected leaks from leaks actually delivered to players.

Measure legitimate prompts incorrectly blocked, attack success, latency under defined conditions, and usage/cost where available. Treat proposed latency and availability figures as targets until measured. Record limitations and avoid tuning against the final evaluation set without disclosure.

For carbon behavior, demonstrate high intensity, low intensity, stale/unavailable readings, and the maximum delay rule. Label simulated data and estimates. Local measurements do not directly measure hosted-model energy, and deferring work alone does not prove a quantified emissions saving. Gameplay and required CI checks remain available.

## 10. Completion and submission

- [ ] Required functionality is demonstrated against the rubric.
- [ ] Serious defects are resolved; known limitations are documented.
- [ ] Final evaluation results are reproducible and tied to the submitted version.
- [ ] A teammate installs and runs the project from a fresh checkout using the README.
- [ ] Deployment, persistence, monitoring, and carbon-policy demonstrations work.
- [ ] Architecture diagrams and decision records reflect what was implemented.
- [ ] The report distinguishes actual results from targets, estimates, simulations, and planned work.
- [ ] Contributions and AI use are documented according to university requirements.
- [ ] The exact release is tagged and submission links are accessible to assessors.
- [ ] Demo steps, reset instructions, and a clearly identified backup recording are ready.
- [ ] Every teammate rehearses their explanation and can trace a request through the system.
- [ ] Submission files and receipt are checked before the confirmed deadline time.

After assessment and any required access period, retain the submitted version and evidence, remove unneeded hosted resources, and revoke unused credentials. Record a short retrospective: what worked, what caused delays, and what would be changed next time.

## 11. Immediate next actions

1. Add the official rubric and confirm the submission time, platform, and AI-use rules.
2. Assign actual names to roles and select the shared repository and task tracker.
3. Confirm framework choices, session approach, model budget, and fallback scope.
4. Check each person's development setup and establish verified startup instructions.
5. Complete a small reviewed contribution per teammate, then build the first complete level.

## 12. Reference links

Product setup can change. Verify current instructions and compatible versions during installation.

- [Codex desktop quickstart](https://learn.chatgpt.com/docs/quickstart)
- [Codex IDE integration](https://learn.chatgpt.com/docs/codex/ide)
- [Codex AGENTS.md instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [VS Code on Windows](https://code.visualstudio.com/docs/setup/windows)
- [Git for Windows](https://git-scm.com/install/windows)
- [Python downloads](https://www.python.org/downloads/)
- [Node.js downloads](https://nodejs.org/en/download)
- [Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [GitHub collaboration workflow](https://docs.github.com/en/get-started/using-github/github-flow)

Maintain this guide when team decisions or dates change. Keep recommendations distinguishable from accepted requirements, and record progress in the shared task tracker rather than implying that a planned milestone has been achieved.
