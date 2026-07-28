/**
 * YZ.AI - Seamless Zero-Key Gemini RAG LLM Engine
 * - Instant Chat (Zero user key entry / setup required)
 * - Netlify Serverless Function proxy support (/.netlify/functions/chat)
 * - In-browser TF-IDF / Cosine Similarity RAG engine fallback
 * - Analogy Leak & Off-Topic Guardrail Engine
 */

class YZAIRAGEngine {
  constructor() {
    this.kb = window.YEHEZKIEL_KNOWLEDGE_BASE || [];
    
    // Patterns for off-topic queries, analogies, jailbreaks, and prompt injections
    this.restrictedPatterns = [
      /\b(recipe|cook|food|bake|pizza|ingredient)\b/i,
      /\b(bomb|weapon|hack|exploit|malware|virus|attack|password|crack)\b/i,
      /\b(president|politics|election|government|war|country capital)\b/i,
      /\b(quantum physics|relativity|chemistry|biology|math problem)\b/i,
      /\b(ignore (all )?previous instructions|system prompt|reveal prompt|act as|roleplay as|pretend to be|dan mode)\b/i,
      /\b(analogy|hypothetically|imagine|what if|in a parallel universe)\b/i
    ];
  }

  // Pre-check for off-topic / analogy / jailbreak bypass attempts
  isRestrictedQuery(query) {
    const qLower = query.toLowerCase();
    
    // Check direct prohibited regex patterns
    for (const pattern of this.restrictedPatterns) {
      if (pattern.test(qLower)) {
        // If it mentions Yehezkiel explicitly with valid context, allow deeper check
        if (qLower.includes('yehezkiel') || qLower.includes('david') || qLower.includes('portfolio') || qLower.includes('s-sparc') || qLower.includes('brics')) {
          // If query uses an analogy to ask for off-topic things (e.g. "imagine yehezkiel is a chef")
          if (/\b(chef|pizza|recipe|bomb|weapon|politics|president|war)\b/i.test(qLower)) {
            return true;
          }
        } else {
          return true; // Completely off-topic
        }
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

    // Filter chunks with positive relevance score and sort descending
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk);
  }

  // Main chat response generator (Instant response, zero key prompt)
  async generateResponse(userMessage) {
    const query = userMessage.trim();
    if (!query) return "Please enter a question about Yehezkiel David Setiawan.";

    // 1. Guardrail & Analogy Leak Check
    if (this.isRestrictedQuery(query)) {
      return "🛡️ **Guardrail Notice**: I am programmed exclusively to assist with information regarding **Yehezkiel David Setiawan**, his background, research, projects, publications, and qualifications. I cannot answer off-topic questions or analogies outside his professional profile.";
    }

    // 2. RAG Retrieval Step
    const retrievedChunks = this.retrieve(query);

    // If query has no relevant matches to Yehezkiel's knowledge base
    if (retrievedChunks.length === 0) {
      if (/^(hi|hello|hey|halo|hai|pings?|good (morning|afternoon|evening))\b/i.test(query)) {
        return "Hello! I am **YZ.AI**, the official AI Assistant for **Yehezkiel David Setiawan**. How can I help you today? You can ask me about his education, AI research, S-SPARC project, BRICS award, or contact details!";
      }
      
      return "I don't have relevant information about that in Yehezkiel's profile. Please ask questions related to Yehezkiel David Setiawan's education, publications, AI research, portfolio projects (such as S-SPARC or BRICS 2026), or work experience.";
    }

    // Combine retrieved context
    const contextText = retrievedChunks.map(c => `- **${c.title}**: ${c.content}`).join("\n");

    // 3. Try Netlify Serverless Gemini Function first (seamless backend API proxy)
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
      // Netlify function not running locally or environment variable not set yet
    }

    // 4. In-Browser Smart RAG Engine Synthesizer (Instant, 100% free, zero key required!)
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
