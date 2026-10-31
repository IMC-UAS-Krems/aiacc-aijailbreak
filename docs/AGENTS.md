# Robin Hoodie: instructions for coding assistants

## Context

This is a three-person university project due December 4, 2026. One contributor has some development experience; two are beginners. Explain material changes clearly so contributors can understand and defend their work.

Use [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for onboarding and development workflow. Consult [outputs/architecture.md](docs/architecture.md) for service boundaries and level rules, and [outputs/Robin_Hoodie_Project_Specification.md](docs/exp_architecture.md) for detailed requirements. Read the parts relevant to the task rather than every document for every edit.

## Working agreements

- Distinguish confirmed requirements, recommendations, open decisions, and measured results. Do not silently convert proposed technologies into accepted decisions.
- If documents disagree in a way that affects the requested work, identify the specific conflict and resolve it with the team. Continue independent work where possible.
- Keep contributions focused and reviewable. Follow existing patterns and avoid unrelated rewrites or new infrastructure.
- Preserve teammates' edits. Check the current working state before modifying files.
- Use current documentation for installed dependency versions. Record dependency versions through the project's chosen dependency files and lockfiles.
- Run relevant checks for behavior changes. Report what passed, failed, or could not be run; do not claim unperformed verification.
- Use predictable fake model responses for ordinary development tests and separate real-model evaluations for defense quality. Keep paid evaluation runs explicitly scoped.
- Maintain relevant setup instructions and decision records when behavior or setup changes. Never invent runnable commands before verifying them.
- At handoff, summarize the change, verification, remaining issues, and next useful step. Explain unfamiliar concepts when they matter.
- Do not assume another chat or teammate's assistant has this conversation's context. Persist material decisions in the repository or shared issue tracker.

## Game rules to preserve

- The AI input guard runs only on levels 4 and 5. Required guard failures stop those requests.
- Output filters run only on levels 3 and 5. Check replies before delivery; do not stream unchecked text on filtered levels.
- Leak detection, output filtering, and password validation are separate. A detected leak never completes a level.
- Validate passwords and level access on the server. Persist completion and unlocking before confirming success; repeated submissions must not duplicate progress.
- Use fictional game passwords. Keep real credentials out of source control, prompts, screenshots, logs, and browser-delivered code.
- Preserve session isolation and general model safety. A safety refusal is not a reason to switch models.
- Label simulated readings and energy/carbon estimates honestly. Do not claim local measurements capture hosted-model energy use.

## Current setup status

No verified application startup or test commands are documented yet. Inspect the repository before proposing them, then add verified commands to README.md when scaffolding is complete.
