# Skill: Deploy

이 프로젝트는 **빌드 단계 없음**. GitHub push → Vercel 자동 재배포.

## 배포 트리거

```bash
git add <파일>
git commit -m "feat/fix/chore: 설명"
git push origin main
```

push 즉시 Vercel이 재배포 시작. 약 30-60초 후 반영.

## 배포 상태 확인

```bash
# Vercel CLI (설치 필요: npm i -g vercel)
vercel ls

# 또는 GitHub Actions / Vercel 대시보드 확인
```

## 환경변수 (Vercel 대시보드에서 관리)

| 변수 | 용도 |
|------|------|
| `GITHUB_TOKEN` | GitHub Contents API 인증 |
| `GITHUB_OWNER` | 리포 소유자 (예: `132589126398124`) |
| `GITHUB_REPO` | 리포 이름 (예: `film-gallery`) |
| `ADMIN_PASSWORD` | 관리자 페이지 비밀번호 |

변수 변경 후 → Vercel 대시보드에서 **Redeploy** 필요.

## 로컬 미리보기

```bash
# Vercel CLI로 로컬 서버리스 함수 포함 실행
npx vercel dev
```

브라우저에서 `http://localhost:3000` 확인.  
단, GitHub Contents API는 실제 환경변수 필요 (`.env.local` 설정).

## 주의

- `images/` 폴더 변경은 업로드/삭제 API가 GitHub에 직접 커밋 — 로컬 pull 필요할 수 있음
- 대용량 이미지 직접 커밋 시 GitHub 파일 크기 제한 100MB 주의
