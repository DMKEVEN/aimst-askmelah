exports.handler = async function (event) {
  // Common CORS headers for response
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight CORS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "GEMINI_API_KEY environment variable is missing on Netlify.",
      }),
    };
  }

  try {
    const bodyData = JSON.parse(event.body || "{}");
    const userPrompt = bodyData.prompt || bodyData.query;

    if (!userPrompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Prompt is required." }),
      };
    }

    // Standard Gemini model endpoints with fallback logic
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let lastError = null;
    let successfulReply = null;

    for (const model of modelsToTry) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: userPrompt }],
              },
            ],
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successfulReply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I couldn't generate a response.";
          break;
        } else {
          lastError = data.error?.message || `Model ${model} failed.`;
          console.warn(`Attempt with ${model} failed:`, lastError);
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`Network attempt with ${model} failed:`, err.message);
      }
    }

    if (successfulReply !== null) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply: successfulReply }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: lastError || "All model endpoints failed." }),
    };
  } catch (error) {
    console.error("Function Execution Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};