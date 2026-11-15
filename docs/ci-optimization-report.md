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
