/**
 * Navigation handling and interactions
 */

export function initNavigation(): void {
  // Highlight active link based on current URL
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a');

  navLinks.forEach((link) => {
    if (link.pathname === currentPath) {
      link.classList.add('active');
    }
  });

  // Add smooth scrolling to anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (href && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}
