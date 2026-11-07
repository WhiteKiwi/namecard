# Namecard

장지훈의 디지털 명함. https://namecard.whitekiwi.link

PIP의 따뜻한 중립 배경, 큰 타이포그래피, 키위색 주 행동을 사용한다.
명함 도안은 제공된 Toss 명함의 앞·뒷면을 재구성했으며 사이트 UI와 구분한다.
앞면은 이름·연락처, 뒷면은 파란 토스 심볼이다. 처음 열면 앞면을 표시한다.

## 개발

Node24, pnpm11.25.0. `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm check`.
`dist/`를 정적 서버로 제공한다. 서버·DB·브라우저 프레임워크는 필요 없다.
PIP는 npm `@whitekiwi/tokens@0.1.1`을 그대로 복사해 사용한다.

- 명함 뒤집기, 앞/뒤 선택, 확대, PNG 다운로드
- vCard3.0 연락처 저장, 전화/메일 실행, 연락처 복사
- native share 지원 시 공유창, 미지원 시 canonical URL 복사
- 정적 OG1200×630, Twitter Card, canonical, robots, sitemap
- 자동/밝게/어둡게 테마, 키보드 조작, reduced-motion
- 포트폴리오와 GitHub 링크: 본인 GitHub 프로필에서 확인한 주소

## 콘텐츠와 분석

`config.json`이 연락처·링크·GA4 설정을 소유한다. 카드에 인쇄된 정보가 바뀌면
`artwork.json` 및 `public/assets/namecard-*`도 다시 검토해야 한다.
빌드는 도안과 설정의 불일치를 거부한다. SVG/PNG는 사진을 바탕으로 재구성했으며
실제 인쇄 원본의 정확한 서체·물리 치수·종이 질감까지 동일함을 보장하지 않는다.

`gaMeasurementId`는 아직 빈 값이다. `G-...` ID를 넣으면 페이지 조회,
명함 조회/확대/다운로드, 연락처 저장/복사, 공유, 주요 링크 클릭이 활성화된다.
custom event에는 전화/메일 값이나 쿼리를 보내지 않는다. GA 속성의 향상된 측정도
연락처 URL을 수집하지 않도록 별도 점검한다. 실시간 수신 검증은 ID 연결 후 한다.

## 디자인 자료

- PIP: https://design.whitekiwi.link / https://github.com/WhiteKiwi/kiwi-design-system
- 공식 Toss 브랜드: https://brand.toss.im/
- 심볼: https://static.toss.im/assets/homepage/brand/Toss_Symbol.zip
- Toss Income: https://static.toss.im/assets/homepage/brand/2026-CI/TossIncome.zip

원본 사진은 배포하지 않는다. `scripts/artwork.mjs`는 선택적 아트워크 편집 도구다.
Sharp0.34 및 Noto Sans CJK KR이 설치된 편집 환경에서 실행하고 PNG를 눈으로 확인해
커밋한다. CI는 검토된 아트워크를 그대로 사용하므로 시스템 글꼴에 의존하지 않는다.
PIP 토큰은 MIT 라이선스이며 배포물에 해당 고지를 포함한다. Toss 상표는 해당 권리자에게 귀속한다.

## CI와 릴리스·배포

PR/main은 `whitekiwi-ubuntu`에서 frozen install, 구문·콘텐츠 검사와 빌드를 실행한다.
패키지 저장소는 `/cache/shared/.pnpm`을 직접 공유한다. node_modules는 job 전용이며
GitHub dependency cache를 사용하지 않는다. `v*` 태그는 main에 포함된 커밋에서만
검증 후 private GitHub Release에 tar·SHA256SUMS·파일별 manifest를 발행한다.
이는 소스/산출물 일관성 증거이며 암호학적 builder attestation은 아니다.

실서비스 활성화는 [infra Namecard 런북](https://github.com/WhiteKiwi/infra/tree/main/services/namecard)을 따른다.
릴리스와 소스를 대조하고 공용 static-hosting의 staging sibling에 안전하게 추출한 뒤
고정 publisher로 원자 교체한다. CI에는 운영 credential이나 Kubernetes 접근권한이 없다.
이전 public tree는 같은 staging 경로에 남는다. 재실행하면 rollback이므로 무작정 재시도하지 않는다.
DNS/TLS/ingress와 서버 자원은 infra가 소유한다.
