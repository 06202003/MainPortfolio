/**
 * Netlify Serverless Function for YZ.AI Chatbot
 * Proxies requests to Gemini 2.0 Flash / 1.5 Flash / Llama 3.1 Flash models
 * 100% Free on Netlify (125,000 requests/month) - Zero Database Required
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

    const systemPrompt = `You are YZ.AI, the official AI assistant representing Yehezkiel David Setiawan (AI Engineer & LLM Researcher).
Your goal is to be helpful, friendly, warm, and professional.
Answer user questions conversationally in 2-4 sentences using the provided context about Yehezkiel David Setiawan, his background, education, research, portfolio projects, and skills.
You can respond in the language the user asked in (English or Indonesian).
If the user asks questions related to tech/AI or Yehezkiel, answer knowledgeably.
If the question is completely off-topic or harmful (bombs, illegal acts, politics), politely decline.

Context:
${contextText}`;

    // 1. Try Gemini 2.0 Flash / 1.5 Flash if Gemini API Key is available
    if (apiKey) {
      const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
      
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
                temperature: 0.4,
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
          console.warn(`Model ${model} failed, trying next fallback...`);
        }
      }
    }

    // 2. Try Groq Llama 3.1 Flash (llama-3.1-8b-instant) if Groq Key is available
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
            temperature: 0.4,
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
