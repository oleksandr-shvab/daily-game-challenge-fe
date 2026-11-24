;(function () {
  // Blocked storage must not stop the page: fall back to the system theme.
  var stored = null
  try {
    stored = localStorage.getItem('theme')
  } catch (e) {}
  var dark =
    stored === 'dark' ||
    (stored !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
})()
