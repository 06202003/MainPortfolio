/**
 * YZ.AI - Balanced RAG LLM Chatbot Engine
 * - Natural, friendly, and conversational AI
 * - Netlify Serverless Function proxy support (/.netlify/functions/chat)
 * - Harmful content & prompt injection guardrails
 * - In-browser smart RAG engine fallback
 */

class YZAIRAGEngine {
  constructor() {
    this.kb = window.YEHEZKIEL_KNOWLEDGE_BASE || [];
    
    // Strict harmful or illegal patterns only
    this.restrictedPatterns = [
      /\b(recipe|cook|food|bake|pizza|ingredient)\b/i,
      /\b(bomb|weapon|hack|exploit|malware|virus|attack|password|crack)\b/i,
      /\b(president|politics|election|government|war)\b/i,
      /\b(ignore (all )?previous instructions|system prompt|reveal prompt|dan mode)\b/i
    ];
  }

  // Pre-check for harmful content or prompt injection attempts
  isRestrictedQuery(query) {
    const qLower = query.toLowerCase();
    
    for (const pattern of this.restrictedPatterns) {
      if (pattern.test(qLower)) {
        // If it specifically asks about Yehezkiel's work/security research, allow
        if (qLower.includes('yehezkiel') && (qLower.includes('research') || qLower.includes('plagiarism') || qLower.includes('thesis'))) {
          return false;
        }
        return true;
      }
    }

    return false;
  }

  // Retrieve top-K relevant knowledge chunks using keyword matching & similarity scoring
  retrieve(query, topK = 3) {
    const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (tokens.length === 0) return this.kb.slice(0, 2);

    const scored = this.kb.map(chunk => {
      let score = 0;
      
      // Keyword match bonus
      chunk.keywords.forEach(kw => {
        if (query.toLowerCase().includes(kw.toLowerCase())) {
          score += 5;
        }
      });

      // Token frequency in content
      const contentLower = chunk.content.toLowerCase();
      tokens.forEach(token => {
        if (contentLower.includes(token)) {
          score += 2;
        }
      });

      return { chunk, score };
    });

    const filtered = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.chunk);

    // If no specific match found, return general bio + skills chunks so Gemini has context
    if (filtered.length === 0) {
      return this.kb.slice(0, 2);
    }

    return filtered.slice(0, topK);
  }

  // Main chat response generator
  async generateResponse(userMessage) {
    const query = userMessage.trim();
    if (!query) return "Please enter a question about Yehezkiel David Setiawan.";

    // 1. Harmful / Prompt Injection Guardrail Check
    if (this.isRestrictedQuery(query)) {
      return "🛡️ **Guardrail Notice**: I am programmed exclusively to assist with information regarding **Yehezkiel David Setiawan**, his background, research, projects, publications, and qualifications. I cannot answer off-topic or restricted questions.";
    }

    // 2. Greetings or Bot Identity fast checks
    if (/\b(kamu gemini|are you gemini|who are you|siapa kamu|kamu siapa|what is yz\.ai|apa itu yz\.ai|who is yz\.ai)\b/i.test(query)) {
      return "I am **YZ.AI**, the official AI portfolio assistant for **Yehezkiel David Setiawan**. I am powered by Google Gemini 1.5 Flash LLM architecture combined with a custom RAG (Retrieval-Augmented Generation) knowledge engine to assist you with Yehezkiel's background, research, publications, and awards!";
    }

    if (/^(hi|hello|hey|halo|hai|pings?|good (morning|afternoon|evening))\b/i.test(query)) {
      return "Hello! I am **YZ.AI**, the official AI Assistant for **Yehezkiel David Setiawan**. How can I help you today? You can ask me about his education, AI research, S-SPARC project, BRICS award, or contact details!";
    }

    // 3. RAG Retrieval Step
    const retrievedChunks = this.retrieve(query);
    const contextText = retrievedChunks.map(c => `- **${c.title}**: ${c.content}`).join("\n");

    // 4. Try Netlify Serverless Gemini Function
    try {
      const netlifyRes = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, contextText })
      });

      if (netlifyRes.ok) {
        const data = await netlifyRes.json();
        if (data.answer) return data.answer;
      }
    } catch (e) {
      // Netlify function not running locally or environment variable pending
    }

    // 5. In-Browser Smart RAG Synthesizer Fallback
    return this.synthesizeRAGAnswer(query, retrievedChunks);
  }

  // In-Browser Smart RAG Synthesizer
  synthesizeRAGAnswer(query, chunks) {
    const primary = chunks[0];
    let reply = `**${primary.title}**\n\n${primary.content}`;
    
    if (chunks.length > 1) {
      reply += `\n\n*Related details:* ${chunks[1].content}`;
    }

    return reply;
  }
}

// Global RAG instance
window.yzAI = new YZAIRAGEngine();
