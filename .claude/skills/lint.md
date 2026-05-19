# Skill: Lint / Format

현재 이 프로젝트에는 **자동 린터/포맷터가 설정되어 있지 않음**.  
수동 컨벤션 확인 방법과 향후 추가 방법을 기술.

## 현재 컨벤션 수동 확인

### JavaScript (main.js, admin.js, api/*.js)
```bash
# Node.js 구문 오류 확인 (API 파일)
node --check api/upload.js
node --check api/auth.js
node --check api/config-read.js
node --check api/config-write.js
node --check api/delete.js
```

프론트엔드 `.js` 파일은 Babel standalone이 처리하므로 Node.js `--check` 불가 (JSX 문법).

### JSON 유효성 확인
```bash
# gallery-config.json 유효성
node -e "JSON.parse(require('fs').readFileSync('gallery-config.json','utf8')); console.log('valid')"
```

### 컨벤션 체크포인트 (수동)
- [ ] 세미콜론 존재?
- [ ] `console.log` 디버그 코드 없음?
- [ ] API 파일 `require()` 없음 (ESM 전용)?
- [ ] 환경변수 하드코딩 없음?
- [ ] I18N 양쪽 언어(`ja`/`ko`) 모두 업데이트?

## 린터 추가 방법 (필요 시)

```bash
# ESLint 추가 (선택사항)
npm install --save-dev eslint

# .eslintrc.json 기본 설정
{
  "env": { "browser": true, "es2020": true, "node": true },
  "parserOptions": { "ecmaVersion": 2020, "sourceType": "module" },
  "rules": {
    "semi": ["error", "always"],
    "no-console": "warn"
  }
}

# 실행
npx eslint api/*.js
```

> 주의: JSX 파일(`main.js`, `admin.js`)에 ESLint 적용 시 `eslint-plugin-react` 및  
> `@babel/eslint-parser` 추가 필요. Plans.md에 계획 작성 후 진행.
