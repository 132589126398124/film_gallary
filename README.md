# 필름 작례 갤러리

서울 거주 아마추어 필름 사진작가가 일본인 여행객 대상으로 필름별 작례를 소개하는 갤러리 사이트.

---

## 배포 방법 (Vercel)

### 1. GitHub 리포지토리 준비

1. GitHub에서 새 리포지토리 생성
2. 이 프로젝트 파일을 push

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Vercel에서 배포

1. [vercel.com](https://vercel.com) 접속 → **Add New Project**
2. GitHub 리포지토리 선택
3. Framework Preset: **Other**
4. **Deploy** 클릭

---

## 환경변수 설정

Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Environment Variables** 에서 아래 4개 변수를 설정합니다.

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub 사용자명 또는 조직명 | `your-username` |
| `GITHUB_REPO` | 리포지토리 이름 | `film-gallery` |
| `ADMIN_PASSWORD` | 관리자 페이지 비밀번호 | `my-secret-pw` |

환경변수 설정 후 **Redeploy** 하면 적용됩니다.

---

## GitHub Personal Access Token 발급

1. GitHub 로그인 → 오른쪽 상단 프로필 클릭 → **Settings**
2. 좌측 메뉴 맨 아래 **Developer settings** 클릭
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)** 클릭
5. Note 입력 (예: `film-gallery`)
6. Expiration: 원하는 기간 선택 (또는 No expiration)
7. Scopes에서 **`repo`** 체크 (전체 리포지토리 접근 권한)
8. **Generate token** → 생성된 토큰을 복사해서 `GITHUB_TOKEN` 환경변수에 붙여넣기

> ⚠️ 토큰은 한 번만 표시됩니다. 반드시 복사해 두세요.

---

## 관리자 페이지 사용법

### 접속

배포된 URL + `/admin.html` 로 접속 (예: `https://your-site.vercel.app/admin.html`)

### 로그인

`ADMIN_PASSWORD` 환경변수에 설정한 비밀번호 입력

### 사진 업로드

1. 원하는 필름 카드를 탭해서 펼치기
2. **📁 タップして選択** 버튼 탭 → 카메라 롤에서 사진 선택
3. 또는 사진 파일을 드래그 앤 드롭
4. 업로드 완료 시 자동으로 저장됩니다

### 사진 삭제

썸네일의 **×** 버튼 클릭 → 확인 → 자동 저장

### 설정 수정 (캐치카피 · 추가요금 · 경고문)

1. 필름 카드를 펼치고 **設定** 섹션에서 수정
2. 화면 하단의 **設定を保存する** 버튼 클릭

---

## 사진 권장 스펙

| 항목 | 권장값 |
|------|--------|
| 포맷 | JPG (파일 크기가 작고 호환성이 좋음) |
| 해상도 | 긴 쪽 **2000px 이하** |
| 색공간 | sRGB |
| 파일 크기 | 1MB 이하 권장 |

파일명은 업로드 시 자동으로 지정됩니다 (`001.jpg`, `002.jpg`, ...).

---

## 파일 구조

```
├── index.html          갤러리 메인 (공개)
├── admin.html          관리자 페이지 (비밀번호 보호)
├── style.css
├── main.js             갤러리 React 컴포넌트
├── admin.js            관리자 React 컴포넌트
├── gallery-config.json 필름 설정 데이터
├── images/             사진 저장 폴더 (GitHub에 커밋됨)
│   ├── 250d/
│   ├── 500t/
│   └── ...
├── api/
│   ├── upload.js       사진 업로드 API
│   ├── config-read.js  설정 읽기 API
│   └── config-write.js 설정 쓰기 API
└── vercel.json
```
