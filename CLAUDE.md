# CLAUDE.md — Film Gallery Harness Context

## 프로젝트 개요

서울 거주 아마추어 필름 사진작가(@i.think.i.left.the.stove.on)가 일본인 여행객을 대상으로 필름별 작례를 소개하는 갤러리 사이트. 관리자 페이지에서 사진 업로드/삭제 및 필름 설정을 관리한다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | HTML5, CSS3, React 18 (UMD CDN), Babel standalone (JSX — 빌드 도구 없음) |
| 백엔드 | Vercel Serverless Functions (Node.js ESM, `/api/*.js`) |
| 데이터 | `gallery-config.json` (필름 설정), `images/<film-id>/` (사진 파일) |
| 스토리지 | GitHub repository (API → GitHub Contents API 경유 커밋) |
| 배포 | Vercel (자동 배포) |
| 분석 | @vercel/analytics |
| 의존성 | busboy (multipart 파싱) |

## 디렉토리 구조

```
film_gallary/
├── index.html          # 갤러리 메인 (공개)
├── admin.html          # 관리자 페이지 (비밀번호 보호)
├── main.js             # 갤러리 React 컴포넌트 (JSX)
├── admin.js            # 관리자 React 컴포넌트 (JSX)
├── style.css           # 전체 스타일
├── gallery-config.json # 필름 메타데이터 (JSON)
├── vercel.json         # Vercel 라우팅·함수 설정
├── package.json        # busboy, @vercel/analytics
├── images/             # 필름별 사진 폴더 (GitHub에 커밋됨)
│   └── <film-id>/      # 예: 250d/, 500t/, ilford400/ ...
├── api/
│   ├── auth.js         # 비밀번호 인증
│   ├── upload.js       # 사진 업로드 (multipart → GitHub)
│   ├── delete.js       # 사진 삭제 (GitHub)
│   ├── config-read.js  # gallery-config.json 읽기
│   └── config-write.js # gallery-config.json 쓰기 (GitHub)
├── .claude/
│   ├── agents/         # 멀티에이전트 페르소나
│   └── skills/         # 표준 명령어 레퍼런스
└── Plans.md            # (작업 전 반드시 작성) 계획 문서
```

## 아키텍처 제약

1. **빌드 도구 없음** — Babel standalone이 브라우저에서 JSX를 트랜스파일. `npm run build` 없음. 파일 변경 즉시 Vercel 재배포로 반영.
2. **React는 CDN UMD** — `import React` 불가. `const { useState, useEffect } = React;` 패턴 사용.
3. **API는 ESM** — `/api/*.js`는 `export default function handler(req, res)` 또는 named export. `require()` 금지.
4. **이미지는 GitHub 커밋** — 업로드/삭제 API가 GitHub Contents API를 직접 호출해 커밋. 로컬 파일시스템 쓰기 불가 (Vercel 서버리스 환경).
5. **환경변수 4개 필수** — `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `ADMIN_PASSWORD`. 코드에 하드코딩 금지.
6. **i18n: ja/ko 이중 언어** — `I18N` 객체(`main.js`)로 관리. 새 UI 문자열은 반드시 두 언어 모두 추가.
7. **무상태 서버리스** — API 함수 간 공유 상태 없음. 각 요청이 독립적.

## 코딩 컨벤션

- **JS:** ES2020+, 세미콜론 사용, 함수 선언식 선호 (`function Foo()` not `const Foo = () =>` for React components)
- **CSS:** BEM 미적용. 의미 있는 클래스명. 모바일 우선 미디어쿼리.
- **API 응답:** `res.status(N).json({ ... })` 패턴 통일
- **에러 처리:** API는 `try/catch`로 감싸고 `500` 반환. 민감 정보 응답에 노출 금지.
- **주석:** WHY가 명확하지 않을 때만. 코드가 설명하는 WHAT 주석 금지.

---

## 하네스 워크플로우 규칙 (STRICT)

### Plan → Work → Review 사이클 강제

**규칙 1: 코드 작성 전 계획 필수**
- 새 기능, 버그 수정, 리팩터링 — 모든 코드 변경은 `Plans.md`에 계획을 먼저 문서화해야 한다.
- `Plans.md`에 해당 작업의 항목이 없으면 코드를 작성하지 않는다.

**규칙 2: Plans.md 형식**
```markdown
## [작업 ID] 작업 제목
- **목표:** 무엇을 달성하는가
- **영향 범위:** 수정될 파일 목록
- **구현 단계:** 번호 매긴 단계별 목록
- **수락 기준:** 완료를 판단하는 검증 가능한 조건
- **상태:** [ 계획됨 | 진행 중 | 완료 | 검토 중 ]
```

**규칙 3: 역할 분리**
- `planner` 에이전트 — 요구사항 분석 및 Plans.md 작성. 코드 작성 금지.
- `worker` 에이전트 — Plans.md의 계획만 구현. 임의 추가 기능 금지.
- `reviewer` 에이전트 — 구현 결과를 Plans.md 수락 기준 및 CLAUDE.md 규칙과 대조.

**규칙 4: 범위 제한**
- 요청된 작업 외 코드 정리, 리팩터링, 기능 추가 금지.
- 작업 중 발견한 부채는 Plans.md에 별도 항목으로 기록.
