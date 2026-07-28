/**
 * YZ.AI - Strict RAG LLM Chatbot Engine
 * - Absolute ban on general code generation (Fibonacci, scripts, algorithms)
 * - Strict RAG scope: Information about Yehezkiel David Setiawan only
 * - Netlify Serverless Function proxy support (/.netlify/functions/chat)
 */

class YZAIRAGEngine {
  constructor() {
    this.kb = window.YEHEZKIEL_KNOWLEDGE_BASE || [];
    
    // Code generation, prohibited topics, and prompt injection regex
    this.codeGenPatterns = [
      /\b(kode|code|script|bikin kode|buatkan kode|generate code|write code|buat program|bikin program|buat fungsi|bikin fungsi)\b/i,
      /\b(fibonacci|fibbonaci|prime number|bubble sort|quick sort|leetcode|factorial|calculator)\b/i
    ];

    this.restrictedPatterns = [
      /\b(recipe|cook|food|bake|pizza|ingredient)\b/i,
      /\b(bomb|weapon|hack|exploit|malware|virus|attack|password|crack)\b/i,
      /\b(president|politics|election|government|war)\b/i,
      /\b(ignore (all )?previous instructions|system prompt|reveal prompt|dan mode)\b/i
    ];
  }

  // Pre-check for code generation or restricted queries
  isRestrictedQuery(query) {
    const qLower = query.toLowerCase();

    // Check code generation patterns
    for (const pattern of this.codeGenPatterns) {
      if (pattern.test(qLower)) {
        // Exception: If query is asking about Yehezkiel's thesis/code plagiarism research paper
        if (qLower.includes('yehezkiel') && (qLower.includes('sstrange') || qLower.includes('plagiarism') || qLower.includes('thesis') || qLower.includes('paper'))) {
          return false;
        }
        return true;
      }
    }
    
    for (const pattern of this.restrictedPatterns) {
      if (pattern.test(qLower)) {
        return true;
      }
    }

    return false;
  }

  // Retrieve top-K relevant knowledge chunks using keyword matching & similarity scoring
  retrieve(query, topK = 3) {
    const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (tokens.length === 0) return [];

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

    // Strictly return matching chunks only (DO NOT return fallback chunks for off-topic queries!)
    return filtered.slice(0, topK);
  }

  // Main chat response generator
  async generateResponse(userMessage) {
    const query = userMessage.trim();
    if (!query) return "Please enter a question about Yehezkiel David Setiawan.";

    // 1. Code Generation & Restricted Query Check
    if (this.isRestrictedQuery(query)) {
      return "🛡️ **Guardrail Notice**: I am programmed exclusively to assist with information regarding **Yehezkiel David Setiawan**, his research, publications, and portfolio. I do not generate general source code snippets or scripts.";
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

    // If query has no relevant matches to Yehezkiel's knowledge base, DECLINE STRICTLY!
    if (retrievedChunks.length === 0) {
      return "🛡️ **Guardrail Notice**: I don't have relevant information about that in Yehezkiel's profile. Please ask questions related to Yehezkiel David Setiawan's education, publications, AI research, portfolio projects (such as S-SPARC or BRICS 2026), or work experience.";
    }

    const contextText = retrievedChunks.map(c => `- **${c.title}**: ${c.content}`).join("\n");

    // 4. Try Netlify Serverless Gemini Function
    try {
      const netlifyRes = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, contextText })
      });

      if (netlifyRes.status === 429) {
        const errorData = await netlifyRes.json();
        const rateErr = new Error('RATE_LIMIT_EXHAUSTED');
        rateErr.isRateLimited = true;
        throw rateErr;
      }

      if (netlifyRes.ok) {
        const data = await netlifyRes.json();
        if (data.isRateLimited) {
          const rateErr = new Error('RATE_LIMIT_EXHAUSTED');
          rateErr.isRateLimited = true;
          throw rateErr;
        }
        if (data.answer) return data.answer;
      }
    } catch (e) {
      if (e.isRateLimited) throw e;
      // Netlify function offline or local mode
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
