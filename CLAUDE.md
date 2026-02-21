# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chat Application — a React 19 SPA with real-time streaming chat powered by OpenAI's API. Features multi-session management, markdown rendering, message virtualization, tool calling (function calling), and conversation export.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite production build
npm run test         # Run all tests (vitest)
npm run test:watch   # Run tests in watch mode
```

Deploy to Vercel:
```bash
npx vercel --token $VERCEL_TOKEN --yes         # Preview deploy
npx vercel --prod --token $VERCEL_TOKEN --yes  # Production deploy
```

## Architecture

**FSD (Feature-Sliced Design)** with layers:

- `src/app/` — Root component, global styles, entry point
- `src/pages/chat/` — ChatPage layout (sidebar + main area)
- `src/widgets/` — Composite UI components (ChatWindow, Sidebar, MessageInput, ModelSettings)
- `src/features/` — Business logic (sendMessage, searchMessages, exportChat)
- `src/entities/message/` — Domain types (Message, ChatSession, ToolCall)
- `src/shared/` — Store (Zustand), API client, theme, utilities

**State Management**: Zustand with `persist` middleware. Two stores:
- `chatStore` — Sessions, messages, streaming state. Sessions stored as `Record<string, ChatSession>`.
- `settingsStore` — Model selection, system prompt, temperature.

**API Layer**: `api/chat.ts` is a Vercel Edge Runtime serverless function. It proxies to OpenAI's REST API directly (no SDK — Edge runtime incompatible). Supports SSE streaming and server-side tool execution with agent loop.

**Styling**: Emotion CSS-in-JS (`@emotion/styled`). Requires `/** @jsxImportSource @emotion/react */` pragma at top of every component file using `css` prop or styled components.

## Key Patterns

- Path alias: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- Messages are streamed via SSE: API sends `data: "chunk"\n\n` format, client parses in `streamChat()`
- `sendMessage()` is a standalone function (not a hook) that imperatively calls `useChatStore.getState()`
- Virtualizer: ChatWindow uses `@tanstack/react-virtual` for large message lists
- MessageItem is `memo()`-wrapped and renders Markdown via `react-markdown` + `remark-gfm` + `rehype-highlight`

## Testing

Tests use Vitest with jsdom environment. Path aliases work via `vitest.config.ts`. Store tests reset state in `beforeEach` using `useChatStore.setState()`.
