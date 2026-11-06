'use strict';
(() => {
  const login = document.querySelector('#github-login');
  const logout = document.querySelector('#github-logout');
  const publish = document.querySelector('#publish-prompts');
  const status = document.querySelector('#publish-status');
  const resultLink = document.querySelector('#publish-result');
  const canonical = library => JSON.stringify(library);
  let apiOrigin;
  try {
    const url = new URL(window.PUBLISHER_CONFIG?.apiOrigin);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error();
    apiOrigin = url.origin;
  } catch (_) {
    status.textContent = '자동 게시 서버의 최초 연결이 필요합니다. 현재는 초안 저장과 파일 다운로드를 사용할 수 있습니다.';
    login.disabled = true;
    return;
  }
  // Keep the encrypted one-hour session only in memory. No localStorage, URL or cookies.
  let session = null, expectedSha = null, popup = null, attempt = null, busy = false;
  let baseline = canonical(JSON.parse(sourcePrompts));
  let loginTimer, pollTimer, pendingCommit = null;
  function controls() { publish.disabled = !session || !expectedSha || busy; login.disabled = busy; logout.hidden = !session; }
  function disconnect() { session = null; expectedSha = null; pendingCommit = null; clearTimeout(pollTimer); controls(); }
  async function api(path, options = {}) {
    const response = await fetch(apiOrigin + path, { ...options, cache: 'no-store', credentials: 'omit', headers: { 'Authorization': 'Bearer ' + session, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    let data;
    try { data = await response.json(); } catch (_) { throw Error('게시 서버 응답을 읽을 수 없습니다.'); }
    if (!response.ok) {
      if (response.status === 401) disconnect();
      if (response.status === 409) expectedSha = null;
      controls();
      throw Error(data.error || '요청을 처리하지 못했습니다.');
    }
    return data;
  }
  status.textContent = 'GitHub에 로그인하면 저장된 전체 수업을 수강생에게 게시할 수 있습니다. 로그인은 이 창을 닫거나 새로고침하면 해제됩니다.';
  login.addEventListener('click', () => {
    if (busy) return;
    attempt = crypto.randomUUID();
    popup = window.open(apiOrigin + '/auth/login?attempt=' + encodeURIComponent(attempt), 'prompt-github-login', 'popup,width=620,height=760');
    if (!popup) { status.textContent = '로그인 팝업이 차단되었습니다. 이 사이트의 팝업을 허용하고 다시 눌러 주세요.'; return; }
    status.textContent = '새 창에서 GitHub 로그인을 완료해 주세요.';
    clearInterval(loginTimer);
    const started = Date.now();
    loginTimer = setInterval(() => {
      if (!popup || popup.closed || Date.now() - started > 600000) {
        clearInterval(loginTimer);
        if (attempt) { attempt = null; status.textContent = '로그인이 완료되지 않았습니다. 다시 로그인해 주세요.'; }
      }
    }, 1000);
  });
  window.addEventListener('message', async event => {
    if (event.origin !== apiOrigin || event.source !== popup || event.data?.type !== 'prompt-auth' || !attempt || event.data.attempt !== attempt) return;
    attempt = null; clearInterval(loginTimer);
    if (event.data.error) { status.textContent = event.data.error; return; }
    if (typeof event.data.session !== 'string') return;
    session = event.data.session; expectedSha = null; busy = true; controls();
    try {
      const data = await api('/api/v2/session');
      if (!isValidList(data.library)) throw Error('공유 파일 형식을 확인할 수 없습니다.');
      if (canonical(data.library) !== baseline) {
        throw Error('GitHub에 더 최신 내용이 있습니다. 초안을 다운로드해 보관하고 이 페이지를 새로고침한 뒤 다시 로그인해 주세요.');
      }
      expectedSha = data.sha;
      status.textContent = `${data.login} 계정으로 로그인했습니다. 전체 수업의 변경 내용을 저장한 뒤 ‘수강생에게 게시’를 눌러 주세요.`;
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; controls(); }
  });
  logout.addEventListener('click', () => { disconnect(); attempt = null; clearInterval(loginTimer); popup?.close(); status.textContent = '이 편집 창에서 로그아웃했습니다. GitHub 사이트의 로그인 상태는 유지됩니다.'; });
  async function pollDeployment(commit, started) {
    if (pendingCommit !== commit || !session) return;
    try {
      const data = await api('/api/v2/deployment?commit=' + encodeURIComponent(commit));
      if (pendingCommit !== commit) return;
      if (data.status === 'completed') {
        pendingCommit = null;
        if (data.conclusion === 'success') {
          status.textContent = '게시 완료! 수강생 페이지에 반영되었습니다. 이미 열어 둔 수강생은 새로고침해 주세요.';
          resultLink.textContent = '수강생 페이지 열기'; resultLink.href = 'https://apple115-code.github.io/prompt/?' + (currentCourse() ? 'course=' + encodeURIComponent(activeCourseId) + '&' : '') + 'v=' + encodeURIComponent(commit);
        } else {
          status.textContent = 'GitHub 파일 저장은 완료됐지만 배포가 완료되지 않았습니다. 배포 내역을 확인해 주세요.';
          resultLink.textContent = '배포 내역 확인'; resultLink.href = data.url;
        }
        busy = false; controls(); return;
      }
      if (Date.now() - started > 600000) {
        pendingCommit = null; busy = false; controls();
        status.textContent = 'GitHub 파일은 저장됐지만 배포 완료 확인이 지연되고 있습니다. 배포 내역에서 확인해 주세요.';
        resultLink.textContent = '배포 내역 확인'; resultLink.href = data.url; return;
      }
      pollTimer = setTimeout(() => pollDeployment(commit, started), 5000);
    } catch (error) {
      busy = false; controls();
      status.textContent = 'GitHub 파일은 저장되었습니다. 배포 상태 확인 실패: ' + error.message;
      resultLink.href = 'https://github.com/apple115-code/prompt/actions'; resultLink.textContent = '배포 내역 확인';
    }
  }
  publish.addEventListener('click', async () => {
    if (!session || !expectedSha || busy) return;
    if (draftValue() !== draftSnapshot) { status.textContent = '입력 중인 내용을 먼저 ‘변경 내용 저장’으로 저장해 주세요.'; return; }
    const items = JSON.parse(JSON.stringify(window.LIBRARY));
    if (!items.courses.length && !window.confirm('모든 수업이 없는 빈 자료실을 게시할까요?')) return;
    busy = true; controls(); resultLink.hidden = true;
    status.textContent = 'GitHub에 프롬프트를 저장하고 있습니다. 창을 닫지 말아 주세요.';
    try {
      const data = await api('/api/v2/publish', { method: 'POST', body: JSON.stringify({ expectedSha, library: items }) });
      expectedSha = data.sha; baseline = canonical(items); pendingCommit = data.commit;
      sourcePrompts = JSON.stringify(items);
      persist();
      status.textContent = 'GitHub 저장 완료. 수강생 페이지 배포를 기다리고 있습니다…';
      resultLink.href = data.siteUrl; resultLink.textContent = '수강생 페이지 열기'; resultLink.hidden = false;
      pollDeployment(data.commit, Date.now());
    } catch (error) {
      // A network failure after PUT may have committed: never silently overwrite on retry.
      expectedSha = null; busy = false; controls();
      status.textContent = error.message + ' 게시 결과가 불확실하면 GitHub 배포 내역을 확인한 뒤 다시 로그인해 주세요.';
    }
  });
  window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
})();
