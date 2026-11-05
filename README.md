# 프롬프트 서가 사용·편집·배포 안내

## 1. 바로 열기

압축파일을 먼저 풀고 `index.html`을 Chrome, Edge, Safari 등의 브라우저로 여세요. 설치, 로그인, 결제, 외부 라이브러리 없이 작동합니다. 인터넷 없이도 검색과 카드 열기를 사용할 수 있습니다. 복사는 브라우저의 허용 범위 내에서 동작하며, 로컬 파일에서도 대체 복사를 시도합니다. 차단되면 본문을 자동 선택하고 수동 복사 안내를 표시합니다. GitHub Pages의 HTTPS 주소에서 사용하면 가장 안정적입니다.

## 2. 포함된 콘텐츠

- 십리대숲: 이전 대화 첨부 이미지의 전체 프롬프트를 전사했습니다. 문장과 문단을 유지했으며 이미지에서 줄 폭 때문에 꺾인 줄만 이어 썼습니다.
- 은하수길·계절정원: 새로 작성한 편집용 예시입니다. 사용자가 제공한 원문이 아닙니다.
- 3D 모델링: 작성 예정 자리표시자입니다. 완성된 수업용 프롬프트가 아닙니다.

## 3. 내용 수정하기

`prompts.js`를 메모장 또는 코드 편집기로 열고 UTF-8로 저장하세요.

- `title`: 카드 제목
- `description`: 짧은 설명
- `text`: 복사할 전체 본문. 양쪽의 백틱(`)을 유지하세요.
- `category`: 배경 이미지는 `background`, 3D 모델링은 `model`
- `status`: 제공 원문은 `original`, 편집용 예시는 `example`, 작성 예정은 `placeholder`
- `id`: 카드마다 다른 영문 이름을 지정하세요.

새 카드는 기존 `{ ... }` 항목을 복제하고 항목 사이에 쉼표를 넣으세요. 본문 안에 백틱 또는 `${`를 넣어야 한다면 각각 앞에 역슬래시를 넣어 이스케이프하세요. 사이트는 입력 내용을 HTML로 해석하지 않고 텍스트로 표시합니다. 관리자 편집 화면이나 서버 저장 기능은 없으며 파일 수정 후 다시 업로드합니다.

## 4. GitHub Pages 무료 배포

수강생에게는 로그인 없는 공개 링크로 제공됩니다. 게시자는 GitHub 계정이 필요합니다. 무료 플랜에서는 Public 저장소를 사용하세요. 게시된 파일과 프롬프트는 공개됩니다.

1. GitHub에 로그인하고 **New repository**를 선택합니다.
2. 저장소 이름을 `prompt-library` 등으로 정하고 **Public**을 선택해 만듭니다.
3. **Add file → Upload files**에서 `index.html`, `style.css`, `prompts.js`, `app.js`, `.nojekyll`을 올립니다. `index.html`이 저장소의 최상위에 위치해야 합니다. ZIP 파일 자체나 상위 폴더를 통째로 올리지 마세요. README는 선택입니다.
4. **Commit changes**로 저장합니다.
5. 저장소의 **Settings → Pages**로 이동합니다.
6. **Build and deployment → Source**를 **Deploy from a branch**로 설정합니다.
7. **Branch**를 **main**, 폴더를 **/(root)**로 선택하고 **Save**를 누릅니다.
8. 배포가 끝나면 Pages에 표시되는 **Visit site** 링크를 엽니다. 주소 형식은 `https://계정명.github.io/prompt-library/`입니다. 실제 저장소 이름에 맞게 달라집니다. 반영까지 최대 10분 정도 걸릴 수 있습니다.
9. 학생에게 이 링크를 공유하세요. 휴대폰에서도 검색·카드 열기·복사를 한 번씩 확인하세요.

수정할 때는 저장소의 `prompts.js`를 열고 연필 버튼으로 편집한 뒤 Commit changes를 누르거나, 수정한 파일을 다시 업로드하세요. 변경이 반영되지 않으면 잠시 기다린 뒤 새로고침하세요. 오류가 나면 저장소 Actions에서 배포 결과를 확인합니다.

공식 안내:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 5. 수업 전 확인

카테고리 필터와 검색은 함께 적용됩니다. 제목·설명·본문에서 검색합니다. 닫힌 카드에서도 전체 복사가 가능합니다. 복사에는 제목·버튼 문구가 섞이지 않고 `text`의 전체 내용만 포함됩니다. 예시/작성 예정 표시는 해당 본문에도 들어 있습니다. 복사 완료 메시지는 실제 복사 성공 후에만 표시됩니다.

인터넷 폰트, 분석 도구, 외부 API를 사용하지 않습니다. 별도의 빌드나 패키지 설치가 필요 없습니다.
