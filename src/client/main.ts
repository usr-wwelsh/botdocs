/**
 * Client-side entry point for botdocs
 */

import { initTheme } from './theme/dark-mode.js';
import { initNavigation } from './navigation.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme system
  initTheme();

  // Initialize navigation
  initNavigation();

  // Lazy load chat if enabled
  const chatWidget = document.getElementById('chat-widget');
  if (chatWidget) {
    // Import chat module dynamically (code splitting)
    import('./chat/chatbox.js').then(({ initChat }) => {
      initChat();
    });
  }
});
