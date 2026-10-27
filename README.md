# 🎶 JUNPLAYLIST

분위기를 고르면 어울리는 음악 플레이리스트를 찾아 주고, 틀어 둔 채로 곡 단위로 듣고 담을 수 있는 웹 앱입니다.

**배포:** https://junplaylist.vercel.app

> React를 처음 배우며 만든 [monplaylist](https://github.com/leehyunjun97/monplaylist)를,
> AI 코딩 도구(Claude Code)를 활용한 개발 방식으로 처음부터 다시 설계하고 만든 프로젝트입니다.

## 주요 기능

- **분위기 추천**: 신나는 / 조용한 / 날씨 → 세부 분위기를 고르면 플레이리스트 영상을 추천 (추천순·조회순 정렬, 더 보기)
- **검색**: 키워드 검색과 최근 검색어
- **플레이어**: 페이지를 옮겨도 끊기지 않는 하단 플레이어, 영상 작게/크게 보기, 반복, 이전/다음(들었던 순서대로 이동), 이어 듣기
- **타임라인**: 업로더가 설명란이나 댓글에 적은 타임스탬프를 읽어 곡 목록으로 보여 주고, 누르면 그 곡으로 이동
- **곡 담기 (MEMORY)**: 듣다가 좋은 곡을 담아 두고, 메모를 남기고, 그 곡의 시작 시간부터 다시 재생
- **AI 의심 표시**: 업로더가 AI 제작을 밝힌 영상에 `AI 의심` 배지 표시
- **좋아요, 재생 히스토리**, 모바일·태블릿·데스크톱 반응형

## 기술 스택

React 19 · TypeScript (strict) · Vite · Zustand · React Router · Tailwind CSS 4 · Vitest + Testing Library · Vercel (배포, 서버리스 함수)

## 기술적 판단

- **API 키 보호와 할당량 관리**: 프론트엔드는 YouTube Data API를 직접 호출하지 않고 Vercel 서버리스 함수(`/api/*`)를 거칩니다. 검색 결과는 CDN에 24시간 캐시해 같은 검색을 모든 사용자가 공유하고, 조회수·설명란은 영상 50개를 한 번에 묶어 받습니다.
- **YouTube 정책 준수**: 플레이어를 숨기고 소리만 재생하지 않고, 작은 상태에서도 최소 크기(200×200px)를 지키며 플레이어 위에 다른 요소를 겹치지 않습니다.
- **타임라인 파싱**: 공식 API에는 챕터 정보가 없어서 설명란의 타임스탬프를 직접 파싱하고, 없으면 업로더 본인이 쓴 댓글(채널 ID 일치)에서 찾습니다. 다양한 실제 설명란 예시로 테스트했습니다.
- **AI 의심 표시**: YouTube의 AI 라벨(`containsSyntheticMedia`)은 영상 주인만 API로 받을 수 있다는 것을 실제 응답으로 확인했습니다. 대신 업로더가 제목·설명란에 밝힌 표현으로 추정하고, 확정할 수 없으므로 "AI 의심"으로 표시합니다.
- **Feature-Sliced Design**: `app → pages → widgets → features → entities → shared` 방향으로만 import하고, 슬라이스 밖에서는 `index.ts`(public API)로만 가져옵니다.

## AI와 협업한 방식

- **[SPEC.md](SPEC.md)**: 무엇을 만들지 (기능, 완료 조건, 데이터 구조, 범위 밖)
- **[CLAUDE.md](CLAUDE.md)**: 어떻게 일할지 (아키텍처 규칙, 코딩 컨벤션, 금지 사항)
- 구현 전에 계획을 먼저 확인하고, 한 번에 기능 하나씩 진행했습니다. 기능마다 SPEC의 완료 조건을 기준으로 테스트를 작성했고, 이해하지 못한 코드는 커밋하지 않았습니다.

## 로컬 실행

```bash
npm install

# 목 데이터로 실행 (API 키 없이 화면을 확인할 수 있음)
npm run dev:mock
```

실제 YouTube 데이터로 실행하려면 `YOUTUBE_API_KEY`가 필요하고, 서버리스 함수까지 함께 띄우려면 `vercel dev`로 실행합니다.

| 명령어              | 설명                       |
| ------------------- | -------------------------- |
| `npm run dev:mock`  | 목 데이터로 개발 서버 실행 |
| `npm run build`     | 프로덕션 빌드              |
| `npm run typecheck` | 타입 검사                  |
| `npm run lint`      | ESLint                     |
| `npm run test`      | Vitest                     |
