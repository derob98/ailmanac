/**
 * Mobile-reliable locale (language) dropdown.
 *
 * The navbar locale dropdown is a `dropdown--hoverable` whose toggle is an
 * <a href="#">. On desktop it opens on hover; our CSS also opens it on
 * :focus-within. But iOS Safari gives a tapped <a> neither :hover nor :focus,
 * so on phones the language menu never opened (you couldn't switch language).
 *
 * This adds a delegated tap handler (mobile widths only) that toggles
 * Docusaurus's own `dropdown--show` class — which opens the menu reliably on
 * touch — and closes it on an outside tap or after picking a language. Desktop
 * hover behaviour is left untouched.
 */
function isMobile() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 996px)').matches;
}

function onClick(e) {
  if (!isMobile()) return; // desktop keeps hover behaviour
  const toggle = e.target.closest('.navbar-locale-dropdown');
  const open = document.querySelector('.navbar__item.dropdown--show');

  if (toggle) {
    // It's the language chip: open/close its menu instead of jumping to "#".
    e.preventDefault();
    const item = toggle.closest('.navbar__item.dropdown');
    if (open && open !== item) open.classList.remove('dropdown--show');
    if (item) item.classList.toggle('dropdown--show');
    return;
  }

  // Tapped a language link inside the open menu, or anywhere outside: close it.
  if (open) open.classList.remove('dropdown--show');
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', onClick);
}

export {};
