/**
 * Netlify Serverless Function for YZ.AI Chatbot
 * Supports Gemini 3.1 Flash Lite / 2.0 Flash Lite / 1.5 Flash Lite models
 * Rate Limit detection: Returns 429 rate limit flag when API quota is exhausted
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query, contextText } = JSON.parse(event.body);

    if (!query) {
      return { statusCode: 400, body: JSON.stringify({ error: "Query is required" }) };
    }

    const apiKey = GEMINI_API_KEY || event.queryStringParameters.key || "";
    const groqKey = GROQ_API_KEY || "";

    const systemPrompt = `You are YZ.AI, the official AI portfolio assistant representing Yehezkiel David Setiawan (AI Engineer & LLM Researcher).

STRICT CODE GENERATION BAN & SCOPE DIRECTIVE:
1. ABSOLUTE CODE BAN: You MUST NEVER generate source code snippets, write programming scripts, or output markdown code blocks (e.g. \`\`\`php, \`\`\`python, \`\`\`js, \`\`\`html, \`\`\`cpp).
2. If the user asks for code implementation, script snippets, or controller code (even if asked alongside Yehezkiel's projects), answer the conceptual/architectural explanation ONLY and STATE CLEARLY: "I do not output source code snippets or scripts. You can explore Yehezkiel David Setiawan's portfolio and architecture details here."
3. You answer questions about Yehezkiel David Setiawan's background, education, AI research, S-SPARC project, BRICS 2026 award, publications, skills, and portfolio.
4. You are ALSO ALLOWED to answer general technology, artificial intelligence, software engineering concepts, computer science, and data science questions conceptually without code blocks.
5. Keep responses concise, professional, friendly, and structured (2-3 sentences max). NEVER output code blocks.

Context:
${contextText}`;

    let lastError = null;

    // 1. Try Gemini 3.1 / 2.0 / 1.5 Flash Lite models
    if (apiKey) {
      const models = [
        "gemini-3.1-flash-lite",
        "gemini-3.0-flash-lite",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
      ];
      
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }] }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 250
              }
            })
          });

          // Check if Gemini API returned Rate Limit (HTTP 429 or RESOURCE_EXHAUSTED)
          if (response.status === 429) {
            return {
              statusCode: 429,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isRateLimited: true, error: "Gemini API Quota Limit Reached" })
            };
          }

          const data = await response.json();
          if (data.error && (data.error.code === 429 || (data.error.message && data.error.message.toLowerCase().includes("quota")))) {
            return {
              statusCode: 429,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isRateLimited: true, error: "Gemini API Quota Limit Reached" })
            };
          }

          if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer: data.candidates[0].content.parts[0].text, modelUsed: model })
            };
          }
        } catch (e) {
          lastError = e;
          console.warn(`Model ${model} failed, attempting fallback...`);
        }
      }
    }

    // 2. Fallback to Groq Llama 3.1 Flash (llama-3.1-8b-instant) if Groq key exists
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query }
            ],
            temperature: 0.1,
            max_tokens: 250
          })
        });

        if (response.status === 429) {
          return {
            statusCode: 429,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRateLimited: true, error: "Groq Rate Limit Reached" })
          };
        }

        const data = await response.json();
        if (data.choices && data.choices[0].message && data.choices[0].message.content) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer: data.choices[0].message.content, modelUsed: "llama-3.1-8b-instant" })
          };
        }
      } catch (e) {
        console.warn("Groq Llama 3.1 Flash failed");
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No active LLM API Key configured in Netlify environment" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
