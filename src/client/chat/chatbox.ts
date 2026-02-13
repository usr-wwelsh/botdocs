/**
 * Chat UI component
 */

import { renderMarkdown } from '../utils/markdown-renderer.js';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ title: string; url: string }>;
}

let isOpen = false;
let messages: Message[] = [];

const STORAGE_KEY = 'botdocs_chat_history';
const STORAGE_OPEN_KEY = 'botdocs_chat_open';
const STORAGE_TIMESTAMP_KEY = 'botdocs_chat_timestamp';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function initChat(): void {
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');

  if (!chatToggle || !chatContainer) {
    console.error('Chat elements not found');
    return;
  }

  // Restore chat state from localStorage
  loadChatState();

  // Toggle chat open/close
  chatToggle.addEventListener('click', () => {
    toggleChat();
  });

  // Render initial chat UI
  renderChatUI(chatContainer);

  // Restore messages if any
  if (messages.length > 0) {
    restoreMessages();
  }

  // Restore open/closed state
  if (isOpen) {
    chatContainer.style.display = 'flex';
  }
}

export function toggleChat(): void {
  isOpen = !isOpen;
  const chatContainer = document.getElementById('chat-container');

  if (chatContainer) {
    chatContainer.style.display = isOpen ? 'flex' : 'none';
  }

  // Save open state
  saveChatOpenState();
}

export function renderChatUI(container: HTMLElement): void {
  container.innerHTML = `
    <div class="chat-header">
      <h3>Ask me anything</h3>
      <div class="chat-header-actions">
        <button class="chat-clear" id="chat-clear" title="Clear chat history">🗑️</button>
        <button class="chat-close" id="chat-close">×</button>
      </div>
    </div>
    <div class="chat-status" id="chat-status">
      Initializing chat...
    </div>
    <div class="chat-messages" id="chat-messages">
      <div class="chat-message assistant">
        <div class="message-content">
          👋 Hi! I'm your documentation assistant. Ask me anything about these docs!
        </div>
      </div>
    </div>
    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <textarea
          class="chat-input"
          id="chat-input"
          placeholder="Ask a question..."
          rows="1"
        ></textarea>
        <button class="chat-send" id="chat-send">Send</button>
      </div>
    </div>
  `;

  // Setup event listeners
  const closeButton = document.getElementById('chat-close');
  const clearButton = document.getElementById('chat-clear');
  const sendButton = document.getElementById('chat-send');
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;

  if (closeButton) {
    closeButton.addEventListener('click', toggleChat);
  }

  if (clearButton) {
    clearButton.addEventListener('click', handleClearChat);
  }

  if (sendButton && input) {
    sendButton.addEventListener('click', () => handleSendMessage(input));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(input);
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });
  }

  // Initialize RAG engine
  initRAGEngine();
}

async function initRAGEngine(): Promise<void> {
  const statusEl = document.getElementById('chat-status');
  if (!statusEl) return;

  try {
    // Lazy load RAG engine
    const { initializeRAG, isRAGReady } = await import('./rag-engine.js');

    statusEl.textContent = 'Loading AI models...';

    await initializeRAG((progress) => {
      statusEl.innerHTML = `
        Loading models... ${Math.round(progress)}%
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      `;
    });

    if (isRAGReady()) {
      statusEl.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to initialize RAG:', error);
    statusEl.textContent = '⚠️ Chat unavailable';
  }
}

function handleClearChat(): void {
  if (confirm('Clear chat history?')) {
    clearChatHistory();

    // Clear UI
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="chat-message assistant">
          <div class="message-content">
            👋 Hi! I'm your documentation assistant. Ask me anything about these docs!
          </div>
        </div>
      `;
    }
  }
}

async function handleSendMessage(input: HTMLTextAreaElement): Promise<void> {
  const message = input.value.trim();
  if (!message) return;

  // Add user message
  addMessage({ role: 'user', content: message });
  input.value = '';
  input.style.height = 'auto';

  // Disable input while processing
  const sendButton = document.getElementById('chat-send') as HTMLButtonElement;
  if (sendButton) sendButton.disabled = true;
  input.disabled = true;

  // Show loading indicator
  showLoading();

  try {
    // Get response from RAG engine
    const { queryRAG } = await import('./rag-engine.js');
    const response = await queryRAG(message);

    // Remove loading indicator
    hideLoading();

    // Add assistant message
    addMessage({
      role: 'assistant',
      content: response.answer,
      citations: response.sources,
    });
  } catch (error) {
    console.error('Chat error:', error);
    hideLoading();
    addMessage({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
    });
  } finally {
    // Re-enable input
    if (sendButton) sendButton.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

export function addMessage(message: Message): void {
  messages.push(message);

  // Save to localStorage
  saveChatHistory();

  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  renderMessage(message, messagesContainer);
}

function renderMessage(message: Message, container: HTMLElement): void {
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${message.role}`;

  // Render user messages as plain text, assistant messages as markdown
  let contentHtml = '';
  if (message.role === 'user') {
    contentHtml = escapeHtml(message.content);
  } else {
    contentHtml = renderMarkdown(message.content);
  }

  let html = `<div class="message-content">${contentHtml}</div>`;

  if (message.citations && message.citations.length > 0) {
    html += '<div class="message-citations">';
    html += '<div class="citations-label">📚 Sources:</div>';
    for (const citation of message.citations) {
      html += `<a href="${escapeHtml(citation.url)}" class="citation-link">${escapeHtml(
        citation.title
      )}</a>`;
    }
    html += '</div>';
  }

  messageEl.innerHTML = html;
  container.appendChild(messageEl);

  // Scroll to bottom smoothly
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
}

function showLoading(): void {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const loadingEl = document.createElement('div');
  loadingEl.id = 'loading-indicator';
  loadingEl.className = 'chat-message assistant';
  loadingEl.innerHTML = `
    <div class="loading-indicator">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  `;

  messagesContainer.appendChild(loadingEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideLoading(): void {
  const loadingEl = document.getElementById('loading-indicator');
  if (loadingEl) {
    loadingEl.remove();
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Save chat history to localStorage with timestamp
 */
function saveChatHistory(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Save chat open/closed state
 */
function saveChatOpenState(): void {
  try {
    localStorage.setItem(STORAGE_OPEN_KEY, JSON.stringify(isOpen));
  } catch (error) {
    console.error('Failed to save chat state:', error);
  }
}

/**
 * Load chat state from localStorage (with expiration check)
 */
function loadChatState(): void {
  try {
    // Check if cache has expired
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    const now = Date.now();

    if (timestamp) {
      const age = now - parseInt(timestamp, 10);
      if (age > CACHE_EXPIRY_MS) {
        // Cache expired, clear it
        clearChatHistory();
        return;
      }
    }

    // Load messages
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      messages = JSON.parse(savedMessages);
    }

    // Load open state
    const savedOpenState = localStorage.getItem(STORAGE_OPEN_KEY);
    if (savedOpenState) {
      isOpen = JSON.parse(savedOpenState);
    }
  } catch (error) {
    console.error('Failed to load chat state:', error);
    messages = [];
    isOpen = false;
  }
}

/**
 * Clear chat history from localStorage
 */
function clearChatHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    messages = [];
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Restore messages to the UI
 */
function restoreMessages(): void {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  // Clear welcome message
  messagesContainer.innerHTML = '';

  // Render all saved messages
  for (const message of messages) {
    renderMessage(message, messagesContainer);
  }
}
