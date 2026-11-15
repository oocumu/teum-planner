# CI 최적화 리포트

측정일: 2026-11-15 · 러너: ubuntu-latest · 반복: 모드별 3회 · [실행 기록](https://github.com/oocumu/teum-planner/actions/runs/43712611769)

## 캐시 적용 전후

| 항목 | 캐시 없음 (평균) | 캐시 적용 (평균) | 개선률 |
|---|---|---|---|
| npm install | 2.27s | 1.83s | **19.6%** |
| 설치 + Lint + Test | 4.09s | 6.67s | **-63.1%** |

캐시 적중: 3/3회

개선률 = (캐시 없음 − 캐시 적용) / 캐시 없음 × 100

## 회차별 결과

| 모드 | 회차 | 캐시 적중 | npm install | 설치 + Lint + Test |
|---|---|---|---|---|
| cache | 1 | O | 1.95s | 7.27s |
| cache | 2 | O | 1.97s | 4.82s |
| cache | 3 | O | 1.56s | 7.92s |
| no-cache | 1 | - | 2.45s | 4.43s |
| no-cache | 2 | - | 2.41s | 4.38s |
| no-cache | 3 | - | 1.96s | 3.46s |

## 적용한 최적화

| 항목 | 7주차 | 8주차 |
|---|---|---|
| 의존성 설치 | 잡마다 setup-node + npm install 반복 | Composite Action `setup-deps`로 통합, `~/.npm` 캐시 |
| Matrix 테스트 | ci.yml에 직접 정의 (2 OS × 2 Node) | Reusable Workflow `reusable-test.yml` (3 OS × 2 Node, macOS·Node 20 제외, Node 24 커버리지 추가) |
| PR 실행 범위 | 전체 Matrix | ubuntu만 실행 |
| 문서만 변경 | 전체 파이프라인 + 배포 | 변경 감지로 Lint·Build·Test·Deploy 생략 |
| 배포 조건 | main push | main push + 앱 코드 변경 |
| 중복 실행 | 없음 | `concurrency`로 이전 실행 취소 |

<!-- 분석: 아래 내용은 리포트 재생성 시 유지됩니다 -->
## 파이프라인 전체 비교

같은 코드에 대한 CI 실행 기록에서 성공한 잡의 실행 시간을 합산했습니다 (러너 대기 시간 제외).

| 실행 | 잡 수 | 잡 실행 시간 합계 | 기록 |
|---|---|---|---|
| 7주차 PR (#8) | 6 | 97s | [43712196608](https://github.com/oocumu/teum-planner/actions/runs/43712196608) |
| 8주차 PR (#9) | 7 | 60s (**−38.1%**) | [43712322992](https://github.com/oocumu/teum-planner/actions/runs/43712322992) |
| 7주차 main push | 7 | 98s | [43712297451](https://github.com/oocumu/teum-planner/actions/runs/43712297451) |
| 8주차 main push | 11 | 157s | [43712440046](https://github.com/oocumu/teum-planner/actions/runs/43712440046) |

- PR은 ubuntu Matrix만 실행하도록 범위를 나눠 잡 실행 시간이 38.1% 줄었습니다.
- main push는 macOS와 Node 24 커버리지가 추가돼(테스트 4개 → 6개) 시간이 늘었습니다. 검증 범위를 넓힌 대가이며, PR 단계에서 빠르게 확인하고 병합 후 전체 Matrix로 검증하는 구조입니다.
- 문서만 바뀐 커밋은 `changes` 잡이 앱 코드 변경 없음을 감지해 Lint·Build·Test·Deploy를 모두 건너뜁니다. 이 리포트를 올린 PR의 실행 기록이 그 예입니다.

## 해석

- npm 캐시는 설치 시간을 평균 19.6% 줄였지만, 설치 + Lint + Test 전체로는 오히려 늘었습니다. 현재 의존성이 ESLint 하나라 설치 자체가 2초 남짓이고, 캐시 복원(다운로드·압축 해제)에 드는 시간이 절약분보다 크기 때문입니다.
- 회차별로 캐시 적용 시간이 4.8~7.9초로 흔들리는 것도 캐시 저장소 다운로드 속도 편차 때문으로 보입니다.
- Next.js로 이전해 의존성이 수백 MB로 늘면 설치 시간이 지배적이 되어 캐시 효과가 커집니다. 이전 후 같은 벤치마크를 다시 실행해 비교합니다.
- 현재 규모에서 실제로 효과가 큰 최적화는 캐시보다 **실행 범위 축소**(PR Matrix 축소, 변경 감지로 잡 생략)입니다.
