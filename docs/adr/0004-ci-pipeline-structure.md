# ADR-0004: CI를 Reusable Workflow와 Composite Action으로 구성한다

- 상태: Accepted
- 날짜: 2026-11-15
- 대체: 7주차 단일 `ci.yml`

## 배경

Lint, Build, Test, 벤치마크 잡마다 Node 설정과 의존성 설치 단계가 반복되었고, 문서만 바뀌어도 전체 Matrix와 배포가 실행되었다.

## 결정

- 설치 단계는 Composite Action(`.github/actions/setup-deps`)으로 묶고 npm 캐시를 적용한다.
- Matrix 테스트는 Reusable Workflow(`reusable-test.yml`)로 분리한다.
- `dorny/paths-filter`로 앱 코드 변경을 감지해, `main` push이면서 앱 코드가 바뀐 경우에만 배포한다.

## 결과

워크플로우 중복이 줄고 문서 변경 시 배포가 생략된다. 캐시 효과는 `docs/ci-optimization-report.md`에 기록한다.
