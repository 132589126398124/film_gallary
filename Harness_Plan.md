# Harness_Plan.md — 하네스 구조 요약 및 첫 번째 테스트 작업

## 생성된 .claude/ 구조

```
film_gallary/
├── CLAUDE.md                        ← 루트 컨텍스트 (프로젝트 요약, 아키텍처 제약, 워크플로우 규칙)
├── Plans.md                         ← 작업 계획 문서 (코드 작성 전 필수 작성)
├── Harness_Plan.md                  ← 이 파일
└── .claude/
    ├── agents/
    │   ├── planner.md               ← 계획 전담: 요구사항 분석 → Plans.md 작성
    │   ├── worker.md                ← 구현 전담: Plans.md만 보고 코드 작성
    │   └── reviewer.md             ← 검토 전담: Plans.md 수락 기준 + CLAUDE.md 규칙 대조
    └── skills/
        ├── deploy.md                ← 배포 명령어 레퍼런스 (git push → Vercel 자동 재배포)
        ├── lint.md                  ← 린트/포맷 확인 방법 (현재 수동, 향후 ESLint 추가 가이드)
        └── test.md                  ← 테스트 절차 (현재 수동, 향후 Jest 추가 가이드)
```

## 에이전트 역할 요약

| 에이전트 | 주요 역할 | 금지 사항 |
|----------|----------|----------|
| `planner` | 요구사항 분석, Plans.md 작성 | 코드 작성 |
| `worker` | Plans.md 기반 구현, 로컬 검증 | 계획 외 기능 추가, 임의 리팩터링 |
| `reviewer` | Plans.md 수락 기준·CLAUDE.md 대조 | 칭찬, 범위 외 제안 |

## 워크플로우 다이어그램

```
사용자 요청
    ↓
[planner] Plans.md에 계획 작성
    ↓
사용자 계획 확인·승인
    ↓
[worker] 계획 기반 구현 → 상태: "검토 중"
    ↓
[reviewer] 수락 기준 대조 검토
    ↓
BLOCKER/MAJOR 없음 → [worker] Plans.md 상태: "완료"
BLOCKER/MAJOR 있음 → [worker] 재작업
```

---

## 첫 번째 테스트 작업 제안

### 목적

하네스 워크플로우(Plan → Work → Review) 전 사이클을 실제로 검증.  
리스크 낮고, 결과 검증이 명확한 작업을 선택.

### 제안 작업: `gallery-config.json` 스키마 유효성 검사기 추가

**왜 이 작업인가?**
- 영향 범위가 `api/config-write.js` 1개 파일로 한정
- 보안 개선 (잘못된 JSON 스키마로 설정 덮어쓰기 방지)
- 빌드 도구 없이 구현 가능
- 수락 기준이 명확 (잘못된 스키마 → 400 반환)

**예상 Plans.md 항목:**
```markdown
## [001] config-write API 스키마 유효성 검사

- **목표:** config-write.js에서 받은 JSON이 올바른 films 배열 스키마인지 검증 후 저장
- **영향 범위:**
  - `api/config-write.js` — 저장 전 스키마 검증 로직 추가
- **구현 단계:**
  1. 요청 body에서 `films` 배열 존재 여부 확인
  2. 각 film 항목에 필수 키(`id`, `name_jp`, `name_en`, `photos`) 존재 확인
  3. 검증 실패 시 `400 Bad Request` 반환
- **수락 기준:**
  - [ ] 올바른 스키마 → 정상 저장 (200)
  - [ ] `films` 배열 없음 → 400
  - [ ] film 항목에 `id` 누락 → 400
  - [ ] 기존 정상 동작 회귀 없음
- **상태:** 계획됨
```

**시작 방법:**
1. 위 항목을 `Plans.md`에 복사
2. planner 에이전트로 계획 상세화 요청
3. worker 에이전트로 구현 요청
4. reviewer 에이전트로 검토 요청
