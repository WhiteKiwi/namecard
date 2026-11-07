try {
  const saved = localStorage.getItem('namecard-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch { /* System theme still works when storage is unavailable. */ }
