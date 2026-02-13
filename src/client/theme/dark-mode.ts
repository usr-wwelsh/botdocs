/**
 * Dark mode toggle with system preference detection
 */

const THEME_STORAGE_KEY = 'botdocs-theme';

export type Theme = 'light' | 'dark';

export function initTheme(): void {
  // Get saved theme or detect system preference
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme: Theme = savedTheme || (prefersDark ? 'dark' : 'light');

  // Apply theme
  applyTheme(theme);

  // Setup toggle button
  const toggleButton = document.querySelector('.theme-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleTheme);
  }

  // Listen for system preference changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
}

export function toggleTheme(): void {
  const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
  const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

  applyTheme(newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') as Theme || 'light';
}
