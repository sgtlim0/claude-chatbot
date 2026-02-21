# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript (tsc -> dist/)
npm start            # Run compiled app
npm run dev          # Run with tsx (no build needed)
```

Type-check without emitting: `npx tsc --noEmit`

## Project Structure

TypeScript + Node.js CLI chatbot using the Anthropic SDK (`@anthropic-ai/sdk`).

- `src/chat.ts` — `Chat` class: manages conversation history and streams Claude API responses
- `src/index.ts` — CLI entry point: readline loop with `/quit` and `/reset` commands
- Requires `ANTHROPIC_API_KEY` environment variable

## Sub-Agent Routing Rules

**Parallel execution** (when all conditions met):
- 3+ independent tasks
- No shared state between tasks
- No overlapping file regions

**Sequential execution** (when any applies):
- Dependencies between tasks (B needs A's result)
- Shared files/state (conflict risk)
- Unclear scope

**Background execution**:
- Research/analysis tasks with no file modifications
- Tasks that should not block current work

## Agent Team Usage

For explicit multi-agent delegation, prompt with role-based task decomposition. The lead agent breaks down work and assigns roles to sub-agents.

Example:
```
Build a user authentication system. Split agents by role:
1. Backend: Express.js login/signup/token refresh routes
2. Frontend: React form components and validation
3. Test: Integration test authoring
4. Review: Full code security audit
```
