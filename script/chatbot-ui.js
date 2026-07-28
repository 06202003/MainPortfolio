/**
 * YZ.AI Chatbot UI Controller
 * Manages floating widget state, message rendering, suggestion chips, instant RAG interaction, and AI rest/pause mode on rate limits.
 */

document.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('yehez-chatbot-launcher');
  const chatWindow = document.getElementById('yehez-chatbot-window');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const chatBody = document.getElementById('chatbot-body');
  const chatForm = document.getElementById('chatbot-form');
  const chatInput = document.getElementById('chatbot-input');
  const chipsContainer = document.getElementById('chatbot-chips');
  const jokowiAudio = document.getElementById('jokowi-audio');
  const sendBtn = chatForm ? chatForm.querySelector('button[type="submit"]') : null;
  const statusEl = document.querySelector('.chatbot-status');

  if (!launcher || !chatWindow) return;

  let isRestMode = false;

  // Function to play audio safely
  function playResponseAudio() {
    if (!jokowiAudio || isRestMode) return;
    try {
      jokowiAudio.currentTime = 0;
      const playPromise = jokowiAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play info:', err);
        });
      }
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  }

  // Pre-unlock audio context on user interaction
  function unlockAudioOnGesture() {
    if (!jokowiAudio || isRestMode) return;
    try {
      jokowiAudio.currentTime = 0;
      const p = jokowiAudio.play();
      if (p !== undefined) {
        p.then(() => {
          jokowiAudio.pause();
          jokowiAudio.currentTime = 0;
        }).catch(() => {});
      }
    } catch (e) {}
  }

  // Activate Rest/Pause Mode when API Quota/Rate Limit is reached
  function activateRestMode() {
    isRestMode = true;
    
    // Disable inputs & buttons
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = "😴 YZ.AI is taking a rest (Quota limit reached)...";
    }
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.5';
      sendBtn.style.cursor = 'not-allowed';
    }
    if (chipsContainer) {
      chipsContainer.style.opacity = '0.5';
      chipsContainer.style.pointerEvents = 'none';
    }

    // Update Status Badge in Header
    if (statusEl) {
      statusEl.innerHTML = '<i class="fa-solid fa-moon text-warning" style="font-size: 8px;"></i> Rest Mode • Quota Limit Reached';
      statusEl.className = 'chatbot-status text-warning';
    }

    // Append Rest Notice Bubble
    addMessage('bot', '☕ **YZ.AI Rest Notice**: The AI LLM model has reached its hourly/daily request quota limit. YZ.AI is currently taking a short rest to recharge its API quota. Please check back in a little while!');
  }

  // Toggle Window Visibility
  launcher.addEventListener('click', () => {
    unlockAudioOnGesture();
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active') && !isRestMode) {
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

  // Simple Markdown-to-HTML parser for bold & lists
  function formatMarkdown(text) {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  }

  // Append message bubble and trigger response audio
  function addMessage(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = formatMarkdown(text);
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Play response audio on bot answer ONLY if it's NOT a Guardrail Notice or Rest Notice
    if (sender === 'bot') {
      const isGuardrail = text.includes('Guardrail Notice') || text.includes('🛡️') || text.includes("I don't have relevant information") || text.includes('Rest Notice');
      if (!isGuardrail) {
        playResponseAudio();
      }
    }
  }

  // Show typing indicator
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-bubble bot typing-indicator';
    indicator.id = 'chat-typing';
    indicator.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> YZ.AI is thinking...';
    chatBody.appendChild(indicator);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing');
    if (indicator) indicator.remove();
  }

  // Process User Question
  async function handleSend(userMsg) {
    if (isRestMode) return;
    const message = userMsg || chatInput.value.trim();
    if (!message) return;

    // Display user message
    addMessage('user', message);
    chatInput.value = '';

    showTypingIndicator();

    try {
      const botResponse = await window.yzAI.generateResponse(message);
      removeTypingIndicator();
      addMessage('bot', botResponse);
    } catch (err) {
      removeTypingIndicator();
      if (err && (err.isRateLimited || err.message === 'RATE_LIMIT_EXHAUSTED')) {
        activateRestMode();
      } else {
        addMessage('bot', '⚠️ Sorry, an error occurred while processing your request. Please try again.');
      }
      console.error(err);
    }
  }

  // Handle Form Submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isRestMode) return;
    unlockAudioOnGesture();
    handleSend();
  });

  // Handle Chips Click
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      if (isRestMode) return;
      if (e.target.classList.contains('chip-btn')) {
        unlockAudioOnGesture();
        const promptText = e.target.getAttribute('data-prompt');
        if (promptText) handleSend(promptText);
      }
    });
  }
});
