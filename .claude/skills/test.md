# Skill: Test

현재 이 프로젝트에는 **테스트 프레임워크가 없음**.  
수동 검증 방법과 향후 테스트 추가 방법을 기술.

## 현재 수동 테스트 절차

### 갤러리 (index.html) 확인 항목
```
1. npx vercel dev  (또는 직접 Vercel 배포)
2. 브라우저 http://localhost:3000 오픈
3. 확인:
   - 필름 목록 로드 (gallery-config.json 읽기)
   - 사진 그리드 표시
   - 언어 토글 (日本語 ↔ 한국어)
   - 모달 열기/닫기 (스와이프 포함)
   - 모바일 뷰 (Chrome DevTools 기기 시뮬레이터)
```

### 관리자 (admin.html) 확인 항목
```
1. /admin.html 접속
2. 확인:
   - 로그인 (올바른/잘못된 비밀번호)
   - 사진 업로드 (JPG, PNG, WebP)
   - 사진 삭제
   - 설정 저장 (캐치카피, 가격 등)
   - 잘못된 MIME 타입 거부 (PDF 등)
```

### API 수동 테스트
```bash
# 설정 읽기
curl http://localhost:3000/api/config-read

# 인증 테스트
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "wrong-password"}'
```

## 테스트 프레임워크 추가 방법 (필요 시)

```bash
# API 단위 테스트 (Jest + node:test 중 선택)
npm install --save-dev jest

# 예: api/__tests__/auth.test.js
```

> 추가 전 Plans.md에 계획 작성 필수.  
> 프론트엔드 테스트 추가 시 React Testing Library 고려 (CDN UMD 환경 제약 있음).
