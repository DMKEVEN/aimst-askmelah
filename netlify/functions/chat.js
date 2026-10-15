exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "CORS preflight successful" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "GEMINI_API_KEY environment variable is missing on Netlify." }) };
  }

  try {
    const bodyData = JSON.parse(event.body || "{}");
    const userPrompt = bodyData.prompt || bodyData.query;

    if (!userPrompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Prompt is required." }) };
    }

    // Try primary stable model endpoint
    const modelsToTry = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ];

    let lastError = null;

    for (const modelUrl of modelsToTry) {
      const apiUrl = `${modelUrl}?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        }),
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ reply: data.candidates[0].content.parts[0].text }),
        };
      }

      lastError = data.error?.message || "Model request failed";
    }

    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: lastError }),
    };

  } catch (error) {
    console.error("Execution Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};