# Plans.md — Film Gallery 구현 계획 문서

> **규칙:** 모든 코드 변경은 이 파일에 계획을 먼저 작성한 후 진행한다.  
> Worker는 이 문서의 계획만 구현한다. Reviewer는 수락 기준과 대조해 검토한다.

---

## [001] 전체 스택 재설계 — Next.js 마이그레이션 + 프론트엔드 재디자인

- **목표:** HTML/UMD/Babel 구조에서 Next.js 15 App Router + TypeScript로 전환. 필름/아날로그 감성 디자인 시스템 적용.
- **영향 범위:**
  - `package.json` — Next.js 15, TypeScript 추가, busboy 제거
  - `next.config.ts` — 신규 (Next.js 설정)
  - `tsconfig.json` — 신규 (TypeScript 설정)
  - `lib/types.ts` — 신규 (Film, GalleryConfig, Lang 타입)
  - `lib/i18n.ts` — main.js I18N 객체 TypeScript 이전
  - `lib/github.ts` — GitHub API 헬퍼 공통화
  - `styles/globals.css` — 재설계 (Playfair Display, DM Sans, 필름 디자인 토큰)
  - `app/layout.tsx` — 루트 레이아웃
  - `app/page.tsx` — SSR 갤러리 페이지 (gallery-config.json 서버사이드 읽기)
  - `app/admin/page.tsx` — 관리자 페이지
  - `components/gallery/*.tsx` — GalleryClient, FilmCard, FilmModal, PriceBadge
  - `components/admin/AdminApp.tsx` — 관리자 전체 (admin.js 이전)
  - `app/api/auth/route.ts` — auth API App Router 이전
  - `app/api/upload/route.ts` — upload API (busboy → request.formData())
  - `app/api/delete/route.ts` — delete API 이전
  - `app/api/config-read/route.ts` — config 읽기 이전
  - `app/api/config-write/route.ts` — config 쓰기 이전
  - `public/images/` — `images/` → `public/images/` (git mv, Next.js static 서빙)
  - 삭제: `index.html`, `admin.html`, `main.js`, `admin.js`, `style.css`, `api/*.js`
- **구현 단계:**
  1. Config 파일 생성 (package.json, next.config.ts, tsconfig.json)
  2. 라이브러리 파일 생성 (lib/types.ts, lib/i18n.ts, lib/github.ts)
  3. 디자인 시스템 CSS 재설계 (styles/globals.css)
  4. App 라우트 생성 (layout.tsx, page.tsx, admin/page.tsx)
  5. 갤러리 컴포넌트 생성 (TypeScript)
  6. 관리자 컴포넌트 생성 (TypeScript)
  7. API 라우트 생성 (App Router format)
  8. 이미지 디렉토리 이전 (git mv)
  9. 구형 파일 삭제 (git rm)
- **수락 기준:**
  - [x] `npm run build` 성공
  - [x] 갤러리 페이지 SSR로 로드
  - [x] 언어 토글 (ja/ko) 동작
  - [x] 필름 카드 클릭 → 모달 열림
  - [x] 모달 스와이프 닫기 동작
  - [x] 관리자 로그인 동작
  - [x] 사진 업로드/삭제 동작
  - [x] 설정 저장 동작
  - [x] Vercel 배포 성공
- **상태:** 검토 중

---
