/*
 * Accounts (demo): a profile and saved views kept in this browser (localStorage).
 * Swap load/save for a real auth + database (e.g. Supabase, Firebase) before launch.
 * No passwords are ever collected here.
 */
(function () {
  "use strict";
  const KEY = "pdh-account-v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  const write = (a) => { try { a ? localStorage.setItem(KEY, JSON.stringify(a)) : localStorage.removeItem(KEY); } catch (e) { /* private mode */ } };
  let acct = read();
  Atlas.Account = {
    get: () => acct,
    signIn(p) { acct = { ...p, saved: acct?.saved || [], recent: acct?.recent || [], since: new Date().toISOString() }; write(acct); },
    signOut() { acct = null; write(null); },
    update(p) { if (!acct) return; Object.assign(acct, p); write(acct); },
    isSaved: (h) => Boolean(acct?.saved.some((v) => v.hash === h)),
    toggleSave(view) {
      if (!acct) return false;
      const i = acct.saved.findIndex((v) => v.hash === view.hash);
      i >= 0 ? acct.saved.splice(i, 1) : acct.saved.unshift(view);
      acct.saved = acct.saved.slice(0, 12); write(acct); return i < 0;
    },
    visit(view) {
      if (!acct) return;
      acct.recent = [view, ...acct.recent.filter((v) => v.hash !== view.hash)].slice(0, 5); write(acct);
    },
  };
})();
