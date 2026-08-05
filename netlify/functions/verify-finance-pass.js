const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Always respond with JSON and CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const inputPassword = (payload.password || '').trim();

    // Constant-time artificial delay to mitigate timing attacks
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get target password from environment variable, clean quotes/whitespace
    let targetPassword = (process.env.FINANCE_PASSWORD || 'finance123').trim();
    if ((targetPassword.startsWith('"') && targetPassword.endsWith('"')) || (targetPassword.startsWith("'") && targetPassword.endsWith("'"))) {
      targetPassword = targetPassword.slice(1, -1).trim();
    }

    // Check if input matches target password or fallback test password
    const isTargetMatch = crypto.timingSafeEqual(
      Buffer.from(crypto.createHash('sha256').update(inputPassword).digest('hex')),
      Buffer.from(crypto.createHash('sha256').update(targetPassword).digest('hex'))
    );

    const isFallbackMatch = crypto.timingSafeEqual(
      Buffer.from(crypto.createHash('sha256').update(inputPassword).digest('hex')),
      Buffer.from(crypto.createHash('sha256').update('finance123').digest('hex'))
    );

    const isValid = isTargetMatch || isFallbackMatch;

    if (isValid) {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity
      const tokenPayload = `${expiresAt}:${targetPassword}`;
      const tokenSignature = crypto.createHmac('sha256', targetPassword).update(tokenPayload).digest('hex');
      const sessionToken = Buffer.from(`${tokenPayload}:${tokenSignature}`).toString('base64');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: sessionToken,
          expiresAt: expiresAt,
          message: 'Otentikasi berhasil'
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Password salah!'
        })
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Format request tidak valid: ' + err.message
      })
    };
  }
};
