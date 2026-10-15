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

    // Official Google AI Studio Interactions API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: userPrompt
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "Failed to call Gemini API" }),
      };
    }

    // Extract text reply from Interactions API schema
    const reply = data.outputs?.[0]?.text || data.text || "I couldn't generate a response.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };

  } catch (error) {
    console.error("Execution Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};