# JUNPLAYLIST

분위기에 맞는 음악 플레이리스트를 찾아 들을 수 있는 웹 앱.
기능 명세, 화면 구성, 데이터 구조는 **SPEC.md**를 참고한다. 이 파일에는 작업 규칙만 적는다.

이 프로젝트는 개발자가 AI 코딩 도구를 활용한 개발을 **학습하는 목적**으로 진행한다.
빠르게 끝내는 것보다, 개발자가 모든 코드를 이해하는 것이 우선이다.

## 기술 스택

React + TypeScript(strict) + Vite / Zustand / React Router / Tailwind CSS / Vitest + Testing Library / Vercel(배포, 서버리스 함수)

## 개발 환경

- Windows + Git Bash 환경이다. 셸 명령은 bash 문법으로 작성한다.

## 명령어

> 프로젝트 세팅 후 package.json의 실제 스크립트와 맞출 것

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run typecheck` — 타입 체크 (`tsc --noEmit`)
- `npm run lint` — ESLint
- `npm run test` — Vitest
- `npm run format` — Prettier
- `vercel dev` — 서버리스 함수(`api/`)까지 포함해 로컬 실행

## 작업 방식

- 구현 전에 **계획부터 보여주고**, 승인을 받은 뒤 진행한다.
- 한 번에 **하나의 기능**만 작업한다. 요청받지 않은 리팩터링이나 기능 추가는 하지 않는다.
- 작업이 끝나면 `typecheck`, `lint`, `test`를 실행하고, 모두 통과한 상태로 마무리한다.
- 마무리할 때 변경한 파일 목록과 **핵심 결정의 이유**를 짧게 설명한다.
- 커밋은 개발자가 직접 한다. 커밋 메시지를 제안할 때는 Conventional Commits 형식을 쓴다. (예: `feat: 분위기 선택 화면 추가`)
- 응답과 코드 주석은 한국어로 쓴다.

## 아키텍처: FSD (Feature-Sliced Design)

```
src/
├── app/        # 라우터, 프로바이더, 전역 스타일
├── pages/      # 라우트 단위 화면
├── widgets/    # 여러 기능을 조합한 큰 UI 블록 (header, player-bar 등)
├── features/   # 사용자 행동 단위 (toggle-like, search-playlist 등)
├── entities/   # 도메인 모델 (playlist, mood, player)
└── shared/     # 도메인과 무관한 공통 코드 (api 클라이언트, ui, lib, config)
api/            # Vercel 서버리스 함수 (FSD 밖)
```

- **import는 위에서 아래로만** 한다. (app → pages → widgets → features → entities → shared)
- **같은 레이어의 다른 슬라이스를 import하지 않는다.** (예: `features/toggle-like`에서 `features/search-playlist` 금지)
- 슬라이스 밖에서는 **`index.ts`(public API)를 통해서만** 가져온다. 내부 파일 경로로 직접 import하지 않는다.
- 세그먼트는 `ui/`, `model/`, `api/`, `lib/`, `config/`를 쓴다.
- 경로 별칭은 `@/`를 쓴다. (예: `import { PlaylistCard } from '@/entities/playlist'`)
- **가볍게 시작한다.** 처음부터 모든 레이어를 채우지 않는다. 코드가 페이지 안에서 커지거나 두 곳 이상에서 재사용될 때 `features`/`widgets`로 분리한다.
- 코드를 어느 레이어에 둘지 애매하면(특히 entity vs feature) **임의로 정하지 말고, 선택지와 이유를 제시한 뒤 물어본다.**

## 코딩 컨벤션

- 폴더명은 kebab-case, 컴포넌트 파일과 컴포넌트명은 PascalCase.
- 함수형 컴포넌트와 **named export**를 쓴다. default export는 쓰지 않는다.
- `any` 금지. 타입을 모르겠으면 `unknown`을 쓰고 좁혀서 사용한다.
- 컴포넌트 props는 `interface`로 정의한다.
- 스타일은 Tailwind 클래스로만 작성한다. inline style과 별도 CSS 파일은 쓰지 않는다. (전역 스타일 제외)
- 전역 상태는 Zustand 스토어로 만들고, 해당 슬라이스의 `model/`에 둔다.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다.

## API

- 프론트엔드는 YouTube Data API를 **직접 호출하지 않는다.** 반드시 `/api/*` 서버리스 함수를 거친다.
- 개발 중 화면 작업은 목(mock) 데이터로 한다. API 할당량이 적으므로 불필요한 실제 호출을 하지 않는다.

## 금지 사항

- API 키나 비밀값을 코드, 테스트, 커밋에 넣지 않는다. (`.env.local`과 Vercel 환경변수만 사용)
- 새 라이브러리는 **설치 전에 이유와 함께 물어본다.**
- SPEC.md에 없는 기능을 임의로 추가하지 않는다. 필요해 보이면 먼저 제안한다.
- SPEC.md와 CLAUDE.md는 요청 없이 수정하거나 삭제하지 않는다.
