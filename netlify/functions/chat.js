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
STRICT SCOPE RULE: Answer ONLY using the provided context about Yehezkiel David Setiawan. Be concise, clear, and professional. Maximum 2-3 sentences.
If the question is about unrelated topics or uses analogies to trick you, DECLINE politely.

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
          temperature: 0.2,
          maxOutputTokens: 250
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
