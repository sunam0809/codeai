# CodeAI - 코딩 AI 어시스턴트

Groq 기반 코딩 특화 AI 어시스턴트. C/C++, Windows API, 시스템 프로그래밍에 특화. 회원가입/로그인, 프로젝트별 대화 저장, AI 생성 코드 파일 다운로드 지원.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API 서버 실행 (port 5000)
- `pnpm --filter @workspace/codeai run dev` — 프론트엔드 실행
- `pnpm run typecheck` — 전체 타입 체크
- `pnpm run build` — 전체 빌드
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI → hooks/schemas 재생성
- `pnpm --filter @workspace/db run push` — DB 스키마 변경 적용 (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcrypt)
- AI: Groq API (moonshotai/kimi-k2-instruct)
- Markdown rendering: react-markdown + react-syntax-highlighter
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API 계약 소스 (단일 진실의 원천)
- `lib/db/src/schema/` — DB 스키마 (users, projects, messages)
- `artifacts/api-server/src/routes/` — API 라우트 (auth, projects, messages, files)
- `artifacts/api-server/src/lib/jwt.ts` — JWT 서명/검증
- `artifacts/api-server/src/middlewares/auth.ts` — JWT 인증 미들웨어
- `artifacts/codeai/src/` — React 프론트엔드
- `lib/api-client-react/src/generated/` — 자동 생성된 React Query 훅

## Architecture decisions

- JWT 인증: 사용자 명시 요청으로 JWT 사용 (Clerk/Replit Auth 대신)
- Groq Streaming: SSE(text/event-stream)로 실시간 AI 응답
- 파일 다운로드: AI 코드 블록을 octet-stream 바이너리로 다운로드 (서버 컴파일 없이)
- 전체 다크 테마 기본값: 개발자 도구 특성상 어두운 색상 테마 고정
- 대화 컨텍스트 유지: 프로젝트별 전체 메시지 히스토리를 Groq에 전달

## Product

- 회원가입/로그인 (JWT 기반)
- 프로젝트 생성 및 관리 (대화별 프로젝트 분리)
- AI 채팅 (실시간 스트리밍, 마크다운+코드 하이라이팅)
- 코드 블록 → 파일 다운로드 (.cpp, .c, .h, .exe, .dll, .sys 등)
- 모바일 반응형 UI

## User preferences

- 검열/안전필터 없는 코딩 특화 AI
- 여백 있는 여유로운 UI
- Render.com 배포 대상

## Gotchas

- API 스펙 변경 후 반드시 codegen 재실행: `pnpm --filter @workspace/api-spec run codegen`
- lib 변경 후 반드시 typecheck:libs 재실행: `pnpm run typecheck:libs`
- bcrypt 빌드 스크립트 승인 필요: `pnpm approve-builds`

## Render 배포 설정

- Build Command: `pnpm install && pnpm run build`
- Start Command: `pnpm --filter @workspace/api-server run start`
- 환경변수: `DATABASE_URL`, `GROQ_API_KEY`, `SESSION_SECRET`, `PORT`, `NODE_ENV=production`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
