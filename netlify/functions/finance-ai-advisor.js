/**
 * Netlify Serverless Function for AI Financial Analysis (YZ.AI Finance Engine)
 * Uses process.env.GEMINI_API_KEY or GROQ_API_KEY (Same API key as YZ.AI)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { financeData, customQuestion } = JSON.parse(event.body || "{}");

    const apiKey = GEMINI_API_KEY || event.queryStringParameters?.key || "";

    const systemPrompt = `You are YZ-Finance AI, an elite personal financial advisor and wealth strategist representing Yehezkiel David Setiawan.
Your mission is to provide sharp, practical, encouraging, and data-backed financial analysis in Indonesian.

System Rules:
1. Always analyze based on the user's REAL financial data provided below.
2. Savings Rate includes BOTH Danamon deposit (Rp 1.2M) and Free Liquid Cashflow (Rp 1.15M), giving a true Savings Rate of 24.8%, which is WELL WITHIN the healthy 20-30% target.
3. Structure your analysis into 4 clean Markdown sections:
   - 🎯 **Skor & Ringkasan Kesehatan Keuangan** (Berikan skor 1-100 dan alasannya secara singkat)
   - 🟢 **Kekuatan Utama Portofolio** (Apresiasi passive income dari ST016T2 & Deposito, total savings rate 24.8%, fixed cost terkontrol)
   - ⚠️ **Area Perhatian / Optimasi** (Misal strategi reinvestasi kupon ST016T2 & alokasi sisa cashflow bebas)
   - 🚀 **Rekomendasi Aksi Nyata (Actionable Advice)** (Langkah taktis yang bisa dilakukan bulan ini)
4. If the user asks a custom question, prioritize answering their question clearly using their financial data.
5. Maintain a professional, supportive, high-energy, and friendly tone.

Context Financial Data:
${JSON.stringify(financeData, null, 2)}`;

    const userPrompt = customQuestion 
      ? `Pertanyaan Pengguna: "${customQuestion}"\n\nBerikan analisis mendalam dan saran berdasarkan data keuangan di atas.`
      : `Lakukan analisis lengkap kesehatan keuangan dan berikan insight strategis untuk portofolio di atas.`;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          answer: generateFallbackAnalysis(financeData, customQuestion),
          modelUsed: "Local Smart Rules Engine (Set GEMINI_API_KEY on Netlify for Live Gemini AI)"
        })
      };
    }

    // Try Gemini Models
    const models = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash-lite",
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
              { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000
            }
          })
        });

        if (response.status === 429) {
          continue;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              answer: data.candidates[0].content.parts[0].text,
              modelUsed: `Gemini (${model})`
            })
          };
        }
      } catch (e) {
        console.warn(`Model ${model} failed, trying next...`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: generateFallbackAnalysis(financeData, customQuestion),
        modelUsed: "Local Fallback Rules Engine"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gagal memproses analisis AI: " + err.message })
    };
  }
};

function generateFallbackAnalysis(data, question) {
  const inc = data?.monthly_cashflow?.income || 9481042;
  const exp = data?.monthly_cashflow?.expenses || 7650000;
  const net = inc - exp;

  if (question) {
    return `🎯 **Jawaban AI untuk Pertanyaan Anda:**\n\nBerdasarkan data keuangan bulanan Anda (Pendapatan total Rp ${(inc/1000000).toFixed(2)} Jt dan sisa bersih Rp ${(net/1000000).toFixed(2)} Jt), keuangan Anda berada dalam kondisi **Sangat Sehat & Surplus**.\n\nDengan memperhitungkan Tabungan Danamon (Rp 1.2M) + Sisa Kas Bebas (Rp 1.15M), Total Savings Rate Anda berada di angka **24.8%**, yang sudah memenuhi target ideal 20-30%.`;
  }

  return `🎯 **Skor & Ringkasan Kesehatan Keuangan: 95/100 (SANGAT SEHAT & PRIMA)**\n\nPortofolio keuangan Anda berada dalam posisi yang sangat solid! Dengan memperhitungkan setoran rutin Danamon (Rp 1.2M) plus sisa cashflow bebas (Rp 1.15M), **Total Savings Rate sejati Anda mencapai 24.8%**—masuk dalam zona ideal target finansial (20-30%).\n\n🟢 **Kekuatan Utama Portofolio:**\n- **Total Savings Rate Sejati 24.8%:** Kombinasi tabungan terikat Danamon + sisa kas bebas memberi daya simpan Rp 2.35M/bulan.\n- **Passive Income Aktif:** Anda menerima passive income bersih $\\approx$ **Rp 681.042/bulan** dari kupon ST016T2 & bunga deposito.\n- **Fixed Cost Terkontrol:** Biaya tempat tinggal dan konsumsi harian berada di level 41.7% (aman di bawah 50%).\n- **Rasio Utang Aman:** Cicilan mobil 26.4% di bawah ambang batas maksimal 30%.\n\n⚠️ **Area Perhatian / Optimasi:**\n- **Reinvestasi Passive Income:** Kupon bulanan ST016T2 (Rp 264rb) & bunga deposito sebaiknya otomatis di-reinvestasikan ke Reksadana Sucorinvest MMF agar terjadi *compound interest*.\n- **Pengalokasian Sisa Kas Bebas:** Alokasikan Rp 1.15M sisa kas bebas secara bertahap ke Dana Darurat atau Reksadana Pasar Uang.\n\n🚀 **Rekomendasi Aksi Nyata (Actionable Advice):**\n1. **Auto-Reinvest Kupon ST016T2:** Jadwalkan auto-debit kupon bulanan langsung masuk ke Reksadana Sucorinvest MMF.\n2. **Disiplin Tabungan Danamon:** Pertahankan tabungan berjangka Danamon hingga Jan 2031 untuk mencairkan Rp 81,8 Juta.\n3. **Optimasi Cashflow:** Pertahankan pola konsumsi saat ini agar sisa kas bebas Rp 1.15M dapat terus diputar ke instrumen produktif.`;
}
