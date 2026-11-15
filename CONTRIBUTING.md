# 기여 가이드 (CONTRIBUTING)

틈 플래너에 기여해 주셔서 감사합니다. 참여하는 모든 분은 [행동 강령](CODE_OF_CONDUCT.md)을 지켜 주세요.

## 1. 브랜치 전략 (Feature Branch)

`main`은 항상 배포 가능한 상태로 유지하며, **직접 push하지 않습니다.**
모든 작업은 `main`에서 새 브랜치를 따서 진행하고 PR로 병합합니다.

| 접두사 | 용도 | 예시 |
| --- | --- | --- |
| `feat/` | 새 기능 | `feat/schedule-input` |
| `fix/` | 버그 수정 | `fix/date-parse-error` |
| `docs/` | 문서 | `docs/contributing` |
| `refactor/` | 동작 변화 없는 구조 개선 | `refactor/api-client` |
| `style/` | 포맷·CSS 등 | `style/main-layout` |
| `test/` | 테스트 | `test/scheduler-unit` |
| `chore/` | 빌드·설정·기타 | `chore/github-templates` |

브랜치 이름은 소문자, 숫자, 하이픈(-)과 접두사 뒤 슬래시(/)만 사용하고, 가능하면 이슈 번호를 붙입니다. (예: `feat/12-ai-summary`)

```bash
git switch main
git pull origin main
git switch -c feat/12-ai-summary
```

## 2. 커밋 메시지 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>       # 선택: 무엇을, 왜 바꿨는지

<footer>     # 선택: Closes #12, BREAKING CHANGE: ...
```

- **type**: `feat` `fix` `docs` `style` `refactor` `test` `chore` `perf` `ci` `build` `revert`
- **scope**: 바뀐 영역 (선택) — 예: `ui`, `api`, `db`, `scheduler`
- **subject**: 50자 이내, 명령문, 끝에 마침표 없음

**좋은 예**
```
feat(scheduler): 자유 입력 텍스트를 AI로 일정 목록 변환
fix(ui): 모바일에서 캘린더가 잘리는 문제 수정
docs: CONTRIBUTING 및 리뷰 가이드 추가
```

**나쁜 예**
```
수정함
update
feat: 여러가지 고침.
```

한 커밋에는 하나의 논리적 변경만 담습니다.

## 3. Pull Request

1. 브랜치를 push 합니다: `git push -u origin feat/12-ai-summary`
2. GitHub에서 `main` 대상으로 PR을 엽니다.
3. **PR 제목도 Conventional Commits 형식**으로 씁니다. (Squash merge 시 커밋 메시지가 됩니다)
4. PR 템플릿의 체크리스트를 모두 채웁니다.
5. 리뷰어 1명 이상의 Approve를 받은 뒤 **Squash and merge** 합니다.
   - 현재 1인 개발이므로 리뷰 코멘트 후 관리자 권한으로 병합하고, 팀원 합류 시 Approve 필수로 전환한다.
6. 병합 후 브랜치는 삭제합니다.

PR은 작게 유지합니다. (변경 300줄 이하 권장)

## 4. 코드 리뷰

리뷰 규칙과 태그 사용법은 [`docs/REVIEW_GUIDE.md`](docs/REVIEW_GUIDE.md)를 참고하세요.

## 5. 브랜치 보호 규칙 (main)

- PR을 통해서만 병합 가능
- 병합 전 최소 1개의 Approve 필요
- 새 커밋이 push되면 기존 Approve 무효화
- CODEOWNERS 리뷰 필수
- 모든 대화(Conversation) 해결 후 병합
- force push / 삭제 금지

## 6. 개발 환경

Node.js 20.12 이상이 필요합니다. PR을 올리기 전에 아래 명령이 통과하는지 확인합니다.

```bash
npm install
npm run lint
npm test
```

설치 과정은 [Wiki › Getting Started](https://github.com/oocumu/teum-planner/wiki/Getting-Started), 오류 해결은 [Wiki › Troubleshooting](https://github.com/oocumu/teum-planner/wiki/Troubleshooting)을 참고하세요.

## 7. 소통 채널

| 목적 | 채널 |
| --- | --- |
| 버그, 작업 요청 | [Issues](https://github.com/oocumu/teum-planner/issues) |
| 질문, 아이디어 | [Discussions](https://github.com/oocumu/teum-planner/discussions) |
| 설계 변경 제안 | Discussions › RFC → 결론은 [docs/adr](docs/adr)에 기록 |
| 보안 문제 | 공개 Issue 대신 [비공개 보고](https://github.com/oocumu/teum-planner/security/advisories/new) |

## 8. 라이선스

기여한 코드는 [MIT License](LICENSE)로 배포됩니다.
