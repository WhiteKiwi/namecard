# CI · 릴리스 · 배포

## PR과 main

공개 저장소의 [CI](../.github/workflows/ci.yml)는 표준 GitHub-hosted `ubuntu-latest`에서
Node.js 24와 pnpm 11.25.0으로 설치, 빌드, 검사를 순차 실행합니다.

- PR과 `main` push만 자동 실행해 기능 브랜치 push의 중복 검증을 피합니다.
- PR 최신 실행을 남기고, 수동 실행은 `run_id`로 분리합니다.
- 토큰은 `contents: read`, checkout의 `persist-credentials: false`를 사용합니다.
- pnpm/action-setup의 lockfile 기반 다운로드 캐시만 사용합니다. 내부 공유 볼륨은 사용하지 않습니다.
- frozen install과 검사는 캐시 적중 여부와 관계없이 실행합니다. 테스트 동시성은 1입니다.
- 액션은 major 태그, 앱 의존성은 lockfile과 정확한 패키지 버전으로 관리합니다.

공개 전환 시 내부 ARC 등록과 Kiwi ARC App 접근을 해제했습니다.
모든 CI·릴리스 job은 `ubuntu-latest`를 사용하며 내부 러너와 공유 캐시 경로를 포함하지 않습니다.

일반 CI job에는 소유자·fork·bot·Draft 조건으로 검증을 생략하는 `if`를 두지 않습니다.
외부 기여 실행 승인과 저장소 접근은 GitHub 설정에서 관리합니다.
`pull_request_target`으로 기여자의 소스를 실행하지 않습니다.

## 보안 검사

[Security](../.github/workflows/security.yml)는 공개 저장소에서 JavaScript CodeQL과
PR 의존성 변경 검사를 실행합니다. CodeQL은 주간 검사도 수행합니다.
GitHub의 공개 저장소 보안 기능을 사용하므로 비공개 상태에서는 이 두 job을 건너뜁니다.
**건너뜀은 보안 검사 통과가 아닙니다.** 공개 후 첫 실행과 Security 탭을 확인해야 합니다.

[Dependabot](../.github/dependabot.yml)은 npm과 GitHub Actions를 주간 확인합니다.
PIP의 두 패키지는 같은 그룹으로 갱신해 버전을 함께 검토합니다.

## 릴리스 후보 발행

[Release](../.github/workflows/release.yml)는 `v*` 태그 push 또는 기존 태그를 지정한 수동 실행으로 시작합니다.

1. 태그를 checkout하고 해당 커밋이 `main`에 포함되는지 검사합니다.
2. 태그와 `package.json`의 버전이 일치하는지 검사합니다.
3. 읽기 권한의 build job에서 설치·빌드·검사·패키징을 수행합니다.
4. 같은 실행의 artifact를 게시 job으로 전달합니다. 보관 기간은 7일입니다.
5. 소스를 checkout하거나 의존성을 설치하지 않는 게시 job에서 체크섬과 태그가 여전히 manifest의 소스를 가리키는지 확인하고 Release에 올립니다.
   `contents: write`는 이 job에만 부여합니다.

| 파일 | 내용 |
| --- | --- |
| `namecard.tar.gz` | 정적 `dist/` 트리 |
| `manifest.json` | 버전, 정확한 소스 커밋, 파일별 SHA-256 |
| `SHA256SUMS` | archive와 manifest의 SHA-256 |

패키징은 GNU tar가 있는 Linux 환경을 사용합니다.
체크섬과 manifest는 내용 일관성 검증 자료이며 암호학적 builder attestation은 아닙니다.
기존 Release를 덮어쓰거나 기존 태그를 이동하지 않습니다. 부분 업로드 실패는
기존 자산을 먼저 대조하고 복구 방법을 정합니다. 동일 태그의 재실행은 기존 Release가 있으면 실패합니다.

## 정적 호스팅과 운영 활성화

일반 정적 호스팅에서는 검증한 `dist/`를 배포합니다. HTTPS, 올바른 `siteUrl`, MIME type과
캐시 정책을 호스팅 환경에서 설정합니다. 저장소 공개 전환이나 Release 발행이 사이트를 자동 배포하지는 않습니다.

실제 Namecard 운영은 별도 infra 런북의 고정 publisher와 원자 교체 절차를 따릅니다.
CI에는 운영 자격증명이나 Kubernetes 접근권한을 주지 않습니다.
이전 public tree를 보존하는 staging sibling 재실행은 rollback이므로 무작정 재시도하지 않습니다.
운영 DNS/TLS/ingress·서버 자원과 배포 수락 기록은 infra가 관리합니다.
