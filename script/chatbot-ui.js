/**
 * YZ.AI Chatbot UI Controller
 * Manages floating widget state, message rendering, suggestion chips, instant RAG interaction, and response audio playback.
 */

document.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('yehez-chatbot-launcher');
  const chatWindow = document.getElementById('yehez-chatbot-window');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const chatBody = document.getElementById('chatbot-body');
  const chatForm = document.getElementById('chatbot-form');
  const chatInput = document.getElementById('chatbot-input');
  const chipsContainer = document.getElementById('chatbot-chips');

  if (!launcher || !chatWindow) return;

  // Single global Audio instance
  const audioPath = 'data/jokowi-saya-akan-lawan.mp3';
  const jokowiAudio = new Audio(audioPath);

  // Pre-unlock audio playback permissions on user click gesture
  function prepareAudioOnGesture() {
    try {
      jokowiAudio.currentTime = 0;
      const promise = jokowiAudio.play();
      if (promise !== undefined) {
        promise.then(() => {
          jokowiAudio.pause();
          jokowiAudio.currentTime = 0;
        }).catch(() => {});
      }
    } catch (e) {}
  }

  // Play response audio when bot answers
  function playResponseAudio() {
    try {
      jokowiAudio.currentTime = 0;
      const playPromise = jokowiAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Primary audio play blocked, attempting fallback:', err);
          const fallbackAudio = new Audio(audioPath);
          fallbackAudio.play().catch(e => console.error('Audio play error:', e));
        });
      }
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  }

  // Unlock audio permissions on launcher click
  launcher.addEventListener('click', () => {
    prepareAudioOnGesture();
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
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

    // Play response audio on every bot answer
    if (sender === 'bot') {
      playResponseAudio();
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
      addMessage('bot', '⚠️ Sorry, an error occurred while processing your request. Please try again.');
      console.error(err);
    }
  }

  // Handle Form Submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    prepareAudioOnGesture();
    handleSend();
  });

  // Handle Chips Click
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-btn')) {
        prepareAudioOnGesture();
        const promptText = e.target.getAttribute('data-prompt');
        if (promptText) handleSend(promptText);
      }
    });
  }
});
