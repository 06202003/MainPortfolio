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
2. Structure your analysis into 4 clean Markdown sections:
   - 🎯 **Skor & Ringkasan Kesehatan Keuangan** (Berikan skor 1-100 dan alasannya secara singkat)
   - 🟢 **Kekuatan Utama Portofolio** (Apresiasi passive income dari ST016T2 & Deposito, kontrol fixed cost, dll)
   - ⚠️ **Area Perhatian / Optimasi** (Misal tingkat tabungan rutin vs fixed cost, strategi reinvestasi kupon)
   - 🚀 **Rekomendasi Aksi Nyata (Actionable Advice)** (Langkah taktis yang bisa dilakukan bulan ini)
3. If the user asks a custom question, prioritize answering their question clearly using their financial data.
4. Maintain a professional, supportive, high-energy, and friendly tone.

Context Financial Data:
${JSON.stringify(financeData, null, 2)}`;

    const userPrompt = customQuestion 
      ? `Pertanyaan Pengguna: "${customQuestion}"\n\nBerikan analisis mendalam dan saran berdasarkan data keuangan di atas.`
      : `Lakukan analisis lengkap kesehatan keuangan dan berikan insight strategis untuk portofolio di atas.`;

    if (!apiKey) {
      // Fallback local smart analysis if API key is not configured locally
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
          continue; // try next fallback model
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

    // Fallback if all API calls failed
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
  const inc = data?.monthly_cashflow?.income || 8800000;
  const exp = data?.monthly_cashflow?.expenses || 7650000;
  const net = inc - exp;

  if (question) {
    return `🎯 **Jawaban AI untuk Pertanyaan Anda:**\n\nBerdasarkan data keuangan bulanan Anda (Pendapatan total Rp ${(inc/1000000).toFixed(2)} Jt dan sisa bersih Rp ${(net/1000000).toFixed(2)} Jt), keuangan Anda berada dalam kondisi **Sehat & Surplus**.\n\nSaran AI: Pertahankan alokasi dana darurat dan pastikan pengeluaran variabel tetap terkontrol di bawah sisa dana bebas bulanan Anda.`;
  }

  return `🎯 **Skor & Ringkasan Kesehatan Keuangan: 85/100 (SANGAT SEHAT)**
Portofolio keuangan Anda memiliki struktur aset yang terdiversifikasi dengan sangat baik antara instrumen berisiko rendah (Deposito Allo Bank & SeaBank) dan pendapatan tetap berimbal hasil tinggi (Obligasi ST016T2 7.05%).

🟢 **Kekuatan Utama Portofolio:**
- **Passive Income Aktif:** Anda menerima passive income bersih $\\approx$ **Rp 681.042/bulan** dari kupon ST016T2 & bunga deposito tanpa perlu bekerja tambahan.
- **Fixed Cost Terkontrol:** Biaya tempat tinggal dan konsumsi harian berada di level 41.7% (aman di bawah batas 50%).
- **Rasio Utang Aman:** Cicilan mobil 26.4% di bawah ambang batas aman 30%.

⚠️ **Area Perhatian / Optimasi:**
- **Savings Rate Operasional:** Tabungan rutin bulanan Danamon (Rp 1.2M) berkisar 13.6% dari total income. Target ideal secara teoritis adalah 20-30%.
- **Reinvestasi Passive Income:** Kupon bulanan ST016T2 (Rp 264rb) sebaiknya otomatis di-reinvestasikan ke Reksadana Sucorinvest MMF agar terjadi *compound interest*.

🚀 **Rekomendasi Aksi Nyata (Actionable Advice):**
1. **Auto-Reinvest Kupon ST016T2:** Jadwalkan auto-debit kupon bulanan langsung masuk ke Reksadana Pasar Uang.
2. **Evaluasi GoPay Later:** Jaga pengeluaran makan/konsumsi harian agar stabil di angka Rp 2.0M untuk menambah sisa kas bebas menjadi Rp 1.4M/bulan.
3. **Disiplin Danamon:** Pertahankan tabungan berjangka Danamon hingga Jan 2031 untuk mencairkan pokok + bunga Rp 81,8 Juta.`;
}
