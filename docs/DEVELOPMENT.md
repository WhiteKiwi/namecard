# 개발 안내

## 실행과 검증

Node.js 24와 package.json의 pnpm 11.25.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

`check`는 브라우저 JS 구문, 단일 worker 단위 테스트, 생성 HTML의 링크·메타데이터와
PNG 크기를 확인합니다. `dist/`가 입력이므로 먼저 빌드합니다.
화면이나 상호작용을 바꾸면 밝게/어둡게, 좁은 화면/데스크톱, 키보드 포커스와
방향키 선택, reduced-motion을 로컬 브라우저에서 확인합니다.
브라우저 E2E 전체를 기본 CI에 추가하지 않습니다.

## 콘텐츠 수정

이 프로젝트는 특정인의 명함이며, 설정 하나로 완전히 교체되는 템플릿은 아닙니다.

| 변경 | 함께 확인할 곳 |
| --- | --- |
| 이름·직함·소속·연락처·주소 | `config.json`, `artwork.json`, `public/assets/namecard-*`, OG 이미지 |
| 프로필 링크 | `config.json`의 `links` |
| 공개 주소·분석 | `siteUrl`, `gaMeasurementId`, OG와 sitemap |
| 이름에 종속된 vCard 파일명 | `scripts/build.mjs`, `src/index.html`의 `jihoon-jang.vcf` |
| 개인 콘텐츠를 기준으로 하는 테스트 | `tests/content.test.mjs` |
| 회사 로고 | `public/assets/toss-*`, favicon, 도안과 OG, `src/index.html`의 회사 표기 |
| 문서의 실제 화면 | `docs/images/`, README 설명 |

`siteUrl`은 경로·query·마지막 `/`가 없는 HTTPS origin이어야 합니다.
현재 연락처 검증은 한국 휴대전화 `010`으로 시작하는 11자리 형식을 지원합니다.
다른 국가의 전화번호를 지원하려면 검증·표시·vCard 변환을 함께 변경하세요.

### 도안 편집

`scripts/artwork.mjs`는 Sharp 0.34와 Noto Sans CJK KR 글꼴이 있는 편집 환경에서 실행하는
선택적 도구입니다. 일반 설치나 CI에는 이 도구와 시스템 글꼴이 필요하지 않습니다.
별도의 편집 환경에 Sharp를 준비한 뒤 `SHARP_MODULE`로 절대 모듈 경로를 지정할 수 있습니다.

```sh
SHARP_MODULE=/absolute/path/to/sharp node scripts/artwork.mjs
```

앞·뒷면 SVG/PNG, OG, favicon을 생성한 후 글꼴·잘림·연락처를 눈으로 확인합니다.
검토한 도안의 값에 맞게 `artwork.json`을 갱신하고 빌드·검사를 실행합니다.
이 파일을 설정에 맞춰 복사하는 것만으로 이미지의 내용이 검증되지는 않습니다.
원본 실물 사진은 저장소나 배포물에 넣지 않습니다.

## 분석 설정

`gaMeasurementId: ""`이면 GA4가 꺼집니다. 값이 있어도 브라우저 origin과 `siteUrl`이
일치해야 태그를 로드합니다. `config.json`과 측정 ID는 정적 클라이언트에 전달되는 공개 데이터입니다.
서버 비밀키나 서비스 계정 자격증명을 넣지 마세요.

전송하는 동작은 페이지 조회, 명함 조회·확대·다운로드, 연락처 저장·복사,
공유와 프로필 링크 클릭입니다. 연락처 값 대신 항목 종류를, 프로필 URL 대신 링크 순서를 보냅니다.
페이지 정보는 canonical URL, 고정 제목 `Digital namecard`, 빈 referrer를 사용합니다.

GA 스트림의 **향상된 측정**은 끕니다. 자동 외부 링크·파일 수집과 수동 이벤트의 중복을
방지하기 위한 설정입니다. Google tag 설정도 `send_page_view=false`와 정규화한 페이지 정보를
유지해야 합니다. 소스 검사만으로 운영 GA 설정이나 이벤트 수신을 검증했다고 판단하지 않습니다.

## UI 구성

PIP의 CSS 토큰과 native radio 패턴을 사용합니다. 패키지 버전은 둘 다 맞춰 변경합니다.
화면 테마는 `@whitekiwi/ui` 0.2.4 기본 아이콘 ThemeControl markup(`kiwi-theme kiwi-theme--icon`)과 공식 bootstrap/control script입니다. 버튼은 현재 테마와 반대인 밝게/어둡게 전환 동작을 표시합니다. 저장 키는 `namecard-theme`이며 `light`와 `dark`만 저장하고, 자동은 그 키를 삭제합니다. 같은 키에 남아 있던 `auto`·`system`도 삭제하며, 다른 키는 읽지 않습니다.
앞·뒷면 선택의 상태·포커스 스타일도 PIP에서 가져오고,
카드 뒤집기·확대·분석 동작은 앱이 소유합니다.
[PIP 설계 기준](https://github.com/WhiteKiwi/kiwi-design-system/blob/main/DESIGN.md)을 따릅니다.
