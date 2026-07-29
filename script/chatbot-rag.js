/**
 * YZ.AI - Strict RAG LLM Chatbot Engine
 * - Absolute ban on general code generation (Fibonacci, scripts, algorithms)
 * - Strict RAG scope: Information about Yehezkiel David Setiawan only
 * - Netlify Serverless Function proxy support (/.netlify/functions/chat)
 */

class YZAIRAGEngine {
  constructor() {
    this.kb = window.YEHEZKIEL_KNOWLEDGE_BASE || [];
    
    // Truly malicious or prompt injection patterns ONLY
    this.maliciousPatterns = [
      /\b(bomb|weapon|hack|exploit|malware|virus|attack|password|crack|ddos)\b/i,
      /\b(ignore (all )?previous instructions|system prompt|reveal prompt|dan mode)\b/i
    ];
  }

  // Pre-check for malicious queries only
  isMaliciousQuery(query) {
    const qLower = query.toLowerCase();
    for (const pattern of this.maliciousPatterns) {
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
    return filtered.slice(0, topK);
  }

  // Main chat response generator
  async generateResponse(userMessage) {
    const query = userMessage.trim();
    if (!query) return "Please enter a question about Yehezkiel David Setiawan or related AI/software engineering topics.";

    // 1. Malicious / Security Guardrail Check ONLY
    if (this.isMaliciousQuery(query)) {
      return "🛡️ **Security Guardrail Notice**: I am programmed exclusively to assist with information regarding **Yehezkiel David Setiawan**, his portfolio, AI research, and general software engineering topics. I cannot process malicious requests or prompt injections.";
    }

    // 2. Greetings or Bot Identity fast checks
    if (/\b(kamu gemini|are you gemini|who are you|siapa kamu|kamu siapa|what is yz\.ai|apa itu yz\.ai|who is yz\.ai)\b/i.test(query)) {
      return "I am **YZ.AI**, the official AI portfolio assistant for **Yehezkiel David Setiawan**. I am powered by Google Gemini LLM architecture combined with a custom RAG (Retrieval-Augmented Generation) knowledge engine to answer questions about Yehezkiel's background, research, awards, and software engineering concepts!";
    }

    if (/^(hi|hello|hey|halo|hai|pings?|good (morning|afternoon|evening))\b/i.test(query)) {
      return "Hello! I am **YZ.AI**, the official AI Assistant for **Yehezkiel David Setiawan**. How can I help you today? You can ask me about his education, AI research, S-SPARC project, BRICS award, software engineering concepts, or contact details!";
    }

    // 3. RAG Retrieval Step
    const retrievedChunks = this.retrieve(query);
    const contextChunks = retrievedChunks.length > 0 ? retrievedChunks : this.kb.slice(0, 2);
    const contextText = contextChunks.map(c => `- **${c.title}**: ${c.content}`).join("\n");

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

    // 5. In-Browser Smart RAG Synthesizer Fallback with Natural Pivot
    return this.synthesizeRAGAnswer(query, retrievedChunks);
  }

  // In-Browser Smart RAG Synthesizer with Natural Educational Explanations & Pivot
  synthesizeRAGAnswer(query, chunks) {
    const qLower = query.toLowerCase();

    // 1. Special explanation handler for LLM & RAG queries
    if (qLower.includes('llm') && qLower.includes('rag')) {
      return `🤖 **Cara Kerja LLM & RAG (Retrieval-Augmented Generation)**:

1. **Large Language Model (LLM)**: Model AI kecerdasan buatan (seperti Google Gemini) yang dilatih dengan miliaran data teks untuk memahami, memproses, dan menghasilkan bahasa manusia secara alami.
2. **Retrieval-Augmented Generation (RAG)**: Teknik gabungan yang mengambil dokumen/fakta khusus terlebih dahulu dari basis data (*Retrieval*), lalu mengumpankannya ke LLM untuk menyusun jawaban faktual yang akurat tanpa halusinasi.

💡 *Hubungan dengan Pengembang:* **Yehezkiel David Setiawan** mengimplementasikan arsitektur RAG ini pada sistem **YZ.AI Assistant** ini dan menerapkannya dalam riset *AI Code Intelligence & Synthetic Data Evaluation* miliknya.`;
    }

    if (qLower.includes('llm') || qLower.includes('large language model')) {
      return `🤖 **Cara Kerja LLM (Large Language Model)**:

LLM memproses teks masukan (*prompt*), mengubah kata menjadi representasi vektor numerik (*embeddings*), lalu menggunakan arsitektur Transformer untuk memprediksi token/kata berikutnya yang paling relevan secara kontekstual.

💡 *Hubungan dengan Pengembang:* **Yehezkiel David Setiawan** berfokus pada riset fine-tuning LLM, prompt engineering, dan evaluasi kode otomatis.`;
    }

    if (qLower.includes('rag') || qLower.includes('retrieval')) {
      return `💡 **Cara Kerja RAG (Retrieval-Augmented Generation)**:

RAG membagi basis data pengetahuan menjadi potongan teks (*chunks*), mencari potongan paling relevan dengan pertanyaan pengguna (*semantic search*), lalu memberikan konteks faktual tersebut kepada LLM agar menghasilkan jawaban yang akurat.

💡 *Hubungan dengan Pengembang:* **Yehezkiel David Setiawan** mendesain arsitektur RAG custom pada **YZ.AI Assistant** ini untuk menjawab pertanyaan portofolio secara akurat.`;
    }

    // 2. Formatting chunks into natural conversational text
    if (chunks.length > 0) {
      const primary = chunks[0];
      let reply = `📌 **${primary.title}**\n\n${primary.content}`;
      if (chunks.length > 1) {
        reply += `\n\n*Informasi Terkait:* ${chunks[1].content}`;
      }
      return reply;
    }

    // 3. Fallback for general technical questions
    return `Mengenai pertanyaan Anda tentang "${query}": Ini merupakan konsep penting dalam bidang rekayasa perangkat lunak dan kecerdasan buatan.\n\n💡 *Konteks Pengembang:* **Yehezkiel David Setiawan** aktif menerapkan prinsip ilmu komputer terapan, Machine Learning, dan rekayasa data dalam proyek-proyeknya.`;
  }
}

// Global RAG instance
window.yzAI = new YZAIRAGEngine();
