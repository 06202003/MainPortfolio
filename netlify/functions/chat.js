/**
 * Netlify Serverless Function for YZ.AI Chatbot
 * Securely proxies requests to Google Gemini 1.5 Flash-8B API
 * 100% Free on Netlify (125,000 requests/month) - No Database Required!
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No Gemini API key configured in Netlify environment" })
      };
    }

    const systemPrompt = `You are YZ.AI, the official AI assistant representing Yehezkiel David Setiawan (AI Engineer & LLM Researcher).
Your goal is to be helpful, friendly, warm, and professional.
Answer user questions conversationally in 2-4 sentences using the provided context about Yehezkiel David Setiawan, his background, education, research, portfolio projects, and skills.
You can respond in the language the user asked in (English or Indonesian).
If the user asks questions related to tech/AI or Yehezkiel, answer knowledgeably.
If the question is completely off-topic or harmful (bombs, illegal acts, politics), politely decline.

Context:
${contextText}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

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
        body: JSON.stringify({ answer: data.candidates[0].content.parts[0].text })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate LLM response" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
