# 프롬프트 서가

수강생용 한국어 프롬프트 모음입니다. 검색, 카테고리, 접이식 카드, 전체 복사와 복사 완료 알림을 지원합니다.

## 주소

- 수강생: https://apple115-code.github.io/prompt/
- 선생님: https://apple115-code.github.io/prompt/teacher.html

수강생 화면에는 편집 기능을 표시하지 않습니다. 선생님 주소는 편집 화면을 열지만, 실제 게시에는 apple115-code 계정의 GitHub 로그인이 필요합니다.

## 수정하고 게시하기

1. 선생님 주소를 열고 GitHub 로그인을 누릅니다.
2. 편집할 프롬프트를 선택하거나 새 프롬프트를 추가합니다.
3. 변경 내용 저장을 눌러 현재 브라우저에 초안을 저장합니다.
4. 수강생에게 게시를 누릅니다.
5. GitHub 저장 완료 후 배포가 끝나 게시 완료가 표시되면 수강생이 페이지를 새로고침합니다.

파일을 직접 교체할 필요가 없습니다. 공유용 파일 다운로드는 백업용으로 계속 사용할 수 있습니다. 빈 목록을 게시하면 모든 카드가 사라지므로 한 번 더 확인합니다.

다른 창이나 GitHub에서 수정한 내용과 충돌하면 게시를 멈춥니다. 초안을 다운로드해 보관한 뒤 새로고침해서 최신 내용과 비교하세요. 네트워크 오류가 나도 GitHub 저장은 끝났을 수 있으므로 배포 내역을 먼저 확인하세요.

로그인 세션은 현재 편집 창의 메모리에만 보관합니다. 새로고침하면 다시 로그인해야 합니다. 브라우저 초안은 다른 기기와 자동으로 동기화되지 않습니다.

## 콘텐츠

십리대숲 프롬프트와 기존 수정 내용을 유지했습니다. 은하수길·계절정원은 편집용 예시이고 3D 모델링은 작성 예정입니다. 편집 화면에서 각 표시를 변경할 수 있습니다.

## 배포와 파일

HTML/CSS/JS는 GitHub Pages에서 제공합니다. 로그인과 게시 요청은 본인의 Cloudflare Worker가 처리합니다. 수강생은 외부 로그인 없이 사용할 수 있습니다.

수동 배포 설정: Settings → Pages → Deploy from a branch → main → /(root).

주요 파일: index.html(수강생 화면), teacher.html(편집 화면), style.css(디자인), app.js(검색·복사), editor.js(초안 편집), publisher.js(로그인·게시), publisher-config.js(인증 서버 주소), prompts.js(게시된 프롬프트).

prompts.js는 window.PROMPTS에 JSON 배열을 대입하는 형식입니다. 편집 화면을 사용하면 따옴표와 줄바꿈을 자동으로 처리합니다. 수동으로 바꿀 때는 임의 JavaScript를 추가하지 마세요.

비밀 키와 GitHub 원본 토큰은 공개 파일에 넣지 않습니다. 인증 서버는 apple115-code/prompt 저장소의 prompts.js만 게시하도록 제한되어 있습니다. GitHub 권한 안내의 public_repo는 GitHub가 공개 저장소 쓰기에 사용하는 권한 범위입니다.

## 공식 문서

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://developers.cloudflare.com/workers/
