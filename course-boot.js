'use strict';
(async () => {
  const fresh = path => { const u = new URL(path, location.href); u.searchParams.set('fresh', Date.now() + '-' + Math.random().toString(36).slice(2)); return u.href; };
  const script = path => new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = fresh(path); s.onload = () => { s.remove(); resolve(); }; s.onerror = () => { s.remove(); reject(Error('화면을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')); }; document.head.append(s); });
  const read = async () => { if(location.protocol==='file:'){await script('library-data.js');return PromptSchema.validateLibrary(window.LIBRARY);} const r = await fetch('https://prompt-library-publisher.pearapple115.workers.dev/api/v3/library', { cache: 'no-store' }); if (!r.ok) throw Error('수업 자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.'); return PromptSchema.validateLibrary((await r.json()).library); };
  try {
    await script('library-schema.js'); window.LIBRARY = await read();
    await script('course-app.js');
    if (document.body.dataset.teacher === 'true') {
      await script('course-editor.js'); await script('publisher-config.js'); await script('publisher.js');
    } else {
      let refreshing = false;
      const refresh = async (manual = false) => {
        if (refreshing) return; refreshing = true;
        try { const latest = await read(); if (JSON.stringify(latest) !== JSON.stringify(window.LIBRARY)) { window.LIBRARY = latest; render(); showMessage('최신 수업 자료로 갱신했어요.'); } else if (manual) showMessage('최신 자료를 표시하고 있어요.'); }
        catch (_) { if (manual) showMessage('자료 갱신에 실패했어요. 잠시 후 다시 눌러 주세요.'); }
        finally { refreshing = false; }
      };
      document.querySelector('#refresh-prompts').addEventListener('click', () => refresh(true));
      window.addEventListener('focus', () => refresh()); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
      setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    }
  } catch (error) { const notice = document.querySelector('#load-status'); notice.textContent = error.message; notice.hidden = false; }
})();
