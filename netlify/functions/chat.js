/**
 * Netlify Serverless Function for YZ.AI Chatbot
 * Supports Gemini 3.1 Flash Lite / 2.0 Flash Lite / 1.5 Flash Lite models
 * Professional RAG scope: Answers tech & portfolio questions professionally representing Yehezkiel David Setiawan
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

    const systemPrompt = `You are YZ.AI, the official professional AI assistant representing Yehezkiel David Setiawan (AI Engineer & LLM Researcher).

PROFESSIONAL RAG DIRECTIVE:
1. You represent Yehezkiel David Setiawan professionally, intelligently, and warmly.
2. Answer questions about Yehezkiel David Setiawan, his background, education, AI research, S-SPARC project, BRICS award, publications, skills, and experience using the provided Context.
3. If the user asks technical, programming, or coding questions related to Yehezkiel's expertise (AI, LLMs, Python, Go, Laravel, Data Engineering, Machine Learning, Code Plagiarism), answer professionally and knowledgeably, relating it to Yehezkiel's work.
4. If the user asks completely off-topic questions unrelated to Yehezkiel's domain or professional background (e.g. recipes, politics, general non-tech topics), politely decline stating your focus is on Yehezkiel David Setiawan's portfolio and expertise.
5. Respond in the language asked (English or Indonesian) in 2-4 concise, well-formatted sentences.

Context:
${contextText}`;

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
                temperature: 0.3,
                maxOutputTokens: 300
              }
            })
          });

          const data = await response.json();
          if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer: data.candidates[0].content.parts[0].text, modelUsed: model })
            };
          }
        } catch (e) {
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
            temperature: 0.3,
            max_tokens: 300
          })
        });

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
