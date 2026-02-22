# Aether Chat

Deep navy & amber gold 테마의 AI 채팅 애플리케이션. AWS Bedrock (Claude, Nova) 기반 실시간 스트리밍, 멀티 세션 관리, 마크다운 렌더링을 지원합니다.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | FastAPI, LangChain, Python 3.12+ |
| Database | Supabase (PostgreSQL) |
| AI Engine | AWS Bedrock Converse API (Claude, Amazon Nova) |
| State | Zustand 5 (persist middleware) |
| UI | Radix UI primitives, Lucide icons |
| Deployment | Vercel (frontend), Modal (backend) |

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- AWS Bedrock 접근 권한
- Supabase 프로젝트

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:create_app --factory --reload --port 8000
```

### Environment Variables

**Frontend** (`.env.local`):
```
MODAL_BACKEND_URL=https://your-modal-app.modal.run
```

**Backend** (`.env`):
```
AWS_BEARER_TOKEN_BEDROCK=<bedrock-api-key>
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=us.amazon.nova-micro-v1:0
SUPABASE_URL=<supabase-url>
SUPABASE_KEY=<supabase-anon-key>
```

## Architecture

### Frontend — Feature-Sliced Design (FSD)

```
src/
├── app/                        # Next.js App Router, global styles
│   ├── api/chat/route.ts       # Edge proxy → Backend SSE
│   ├── api/sessions/           # Session CRUD proxy
│   ├── layout.tsx              # Root layout (Outfit + Pretendard + Fraunces fonts)
│   └── globals.css             # Aether theme variables, animations
├── views/chat/                 # ChatPage — 3-column layout
├── widgets/
│   ├── chat-window/            # ChatWindow (virtualized), MessageItem (markdown)
│   ├── message-input/          # Auto-expanding textarea, streaming stop
│   ├── sidebar/                # Collapsible sidebar, conversation search
│   └── right-panel/            # Settings (model, temperature, system prompt)
├── features/
│   ├── send-message/           # sendMessage(), stopStreaming()
│   ├── export-chat/            # Markdown/JSON export
│   └── search/                 # Message search with highlighting
├── entities/message/           # Message, ChatSession, TestResult types
└── shared/
    ├── store/                  # chatStore, settingsStore (Zustand)
    ├── api/                    # chatApi (SSE stream), sessionApi (REST)
    ├── lib/                    # generateId, browserId, constants
    ├── hooks/                  # useMediaQuery
    └── ui/primitives/          # Button, Textarea, Dialog, Slider
```

### Backend — Clean DDD

```
backend/app/
├── api/routers/                # HTTP layer
│   ├── chat.py                 # POST /api/chat (SSE streaming)
│   ├── sessions.py             # CRUD /api/sessions
│   └── health.py               # GET /health
├── domain/
│   ├── chat/                   # ChatOrchestrator, ChatService port
│   └── session/                # Session aggregate, SessionRepository port
├── application/                # Use cases (SendMessage, CRUD sessions)
├── infrastructure/
│   ├── chat/bedrock_adapter.py # ChatBedrockConverse (LangChain)
│   ├── session/supabase_adapter.py  # Supabase repository
│   └── database.py             # Supabase client init
└── harness/
    ├── container.py            # DI Container (ports → adapters)
    └── evaluation/             # Model evaluation suite
```

## Key Features

### SSE Streaming
클라이언트는 `ReadableStream` + `TextDecoder`로 SSE를 파싱하고, 백엔드는 FastAPI `StreamingResponse`로 토큰을 실시간 전달합니다. `data: {"content": "token"}\n\n` 포맷을 사용하며, 스트림 완료 시 `data: [DONE]\n\n`을 전송합니다.

### Multi-Session Management
브라우저별 `browserId`로 세션을 격리합니다. 세션 생성/삭제, 핀 고정, 제목 변경을 지원하며, Zustand persist로 로컬 상태를 유지합니다.

### Virtualized Message List
`@tanstack/react-virtual`로 대량 메시지 목록을 가상화합니다. `MessageItem`은 `memo()`로 감싸 불필요한 리렌더링을 방지합니다.

### Markdown Rendering
`react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-sanitize`로 GFM, 코드 하이라이팅, HTML 새니타이징을 처리합니다.

### Responsive Design
데스크톱에서는 3-column 레이아웃 (사이드바 + 채팅 + 설정 패널), 모바일에서는 Sheet drawer로 전환됩니다.

## Design Theme

**Aether** — Deep navy (#070c14) 배경에 amber gold (#e8a838) 액센트. Outfit (본문), Fraunces (로고), IBM Plex Mono (코드) 폰트를 사용합니다. 48px 그리드 배경, 글로우 이펙트, 스트리밍 커서 애니메이션을 포함합니다.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | SSE 스트리밍 채팅 |
| GET | `/api/sessions?browser_id=...` | 세션 목록 (메시지 제외) |
| GET | `/api/sessions/{id}` | 세션 상세 (메시지 포함) |
| POST | `/api/sessions` | 세션 생성 |
| PATCH | `/api/sessions/{id}` | 세션 수정 (title, pinned) |
| DELETE | `/api/sessions/{id}` | 세션 삭제 |
| GET | `/health` | Health check |

## Deployment

### Vercel (Frontend)
`rewrite` 브랜치에서 자동 배포. Edge Runtime으로 `/api/chat` 프록시를 실행합니다.

### Modal (Backend)
```bash
modal deploy backend/modal_app.py
```
`aws-bedrock-secrets`, `supabase-secrets` Secret을 Modal에 설정해야 합니다. `min_containers=1`로 콜드 스타트를 방지합니다.

## License

MIT
