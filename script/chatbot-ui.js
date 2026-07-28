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

  // Response audio player
  const responseAudio = new Audio('data/jokowi-saya-akan-lawan.mp3');

  if (!launcher || !chatWindow) return;

  // Toggle Window Visibility
  launcher.addEventListener('click', () => {
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

  // Append message bubble and trigger audio playback on bot responses
  function addMessage(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = formatMarkdown(text);
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Play response audio on bot answer
    if (sender === 'bot') {
      try {
        responseAudio.currentTime = 0;
        responseAudio.play().catch(err => console.warn('Audio playback info:', err));
      } catch (err) {
        console.warn('Audio play error:', err);
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
    handleSend();
  });

  // Handle Chips Click
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-btn')) {
        const promptText = e.target.getAttribute('data-prompt');
        if (promptText) handleSend(promptText);
      }
    });
  }
});
