// netlify/functions/chat.js
exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { query, faqContext } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `
You are "AIMST AskMeLah!", the official AI university assistant for AIMST University. 
Your job is to answer students, lecturers, and staff accurately, professionally, and naturally, no matter how they phrase their questions, even with typos, slang, or diverse perspectives.

Verified Institutional Knowledge Base:
${JSON.stringify(faqContext)}

Direct Reference Guidelines:
- Student Portal: https://portal.aimst.edu.my/
- Staff Directory: https://aimst.edu.my/staff_/0/
- Student Handbook: https://aimst.edu.my/wp-content/uploads/2019/04/Undergraduate-Student-Handbook8thEdition.pdf
- Admissions: choose@aimst.edu.my | Phone: +604-429 8000
- CIMB Payment Account: CIMB Bank Berhad, AIMST SDN. BHD. REV ACCOUNT, Account No: 8006376912
- First Class Honours Requirement: CGPA 3.67 and above.

Rules:
1. Always ground your answers in the provided knowledge base.
2. If a query is ambiguous, interpret it helpfully from a student or staff perspective.
3. Keep responses clean, structured, and easy to read.
`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { parts: [{ text: systemPrompt }, { text: `User Query: ${query}` }] }
                ]
            })
        });

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that query right now. Please check the Student Handbook.";

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: answer })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};