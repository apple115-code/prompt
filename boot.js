'use strict';
(async () => {
  const fresh = path => { const url = new URL(path, location.href); url.searchParams.set('fresh', Date.now() + '-' + Math.random().toString(36).slice(2)); return url.href; };
  function load(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = fresh(path);
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error('파일을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.')); };
      document.head.append(script);
    });
  }
  const teacher = Boolean(document.querySelector('#editor'));
  const count = document.querySelector('#count'); count.textContent = '최신 프롬프트를 불러오는 중…';
  try {
    await load('prompts.js');
    if (!Array.isArray(window.PROMPTS)) throw Error('프롬프트 파일을 확인해 주세요.');
    await load('app.js');
    if (teacher) {
      await load('editor.js'); await load('publisher-config.js'); await load('publisher.js');
      document.querySelector('#open-editor').click();
    } else {
      let updating = false;
      async function refresh(manual = false) {
        if (updating) return;
        updating = true;
        const previous = window.PROMPTS;
        try {
          await load('prompts.js');
          if (!Array.isArray(window.PROMPTS)) throw Error();
          if (JSON.stringify(previous) !== JSON.stringify(window.PROMPTS)) {
            const openIds = [...document.querySelectorAll('.card details[open]')].map(node => node.dataset.promptId);
            render();
            document.querySelectorAll('.card details').forEach(node => { node.open = openIds.includes(node.dataset.promptId); });
            showMessage('선생님이 게시한 최신 프롬프트로 갱신했어요.');
          } else if (manual) showMessage('최신 프롬프트를 표시하고 있어요.');
        } catch (_) { window.PROMPTS = previous; if (manual) showMessage('최신 내용을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'); }
        finally { updating = false; }
      }
      document.querySelector('#refresh-prompts').addEventListener('click', () => refresh(true));
      window.addEventListener('focus', () => refresh());
      document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
      setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    }
  } catch (error) { count.textContent = error.message; count.setAttribute('role', 'alert'); }
})();
