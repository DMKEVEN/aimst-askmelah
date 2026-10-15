// AIMST AskMeLah! - Production Frontend Client
let faqData = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("./data/faq.json");
        const data = await res.json();
        faqData = data.faqs || [];
    } catch (e) {
        console.error("Failed to load local context cache.");
    }
    setupListeners();
});

function setupListeners() {
    const sendBtn = document.getElementById("send-btn");
    const userInput = document.getElementById("user-input");

    if (sendBtn && userInput) {
        sendBtn.addEventListener("click", handleMessage);
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleMessage();
        });
    }
}

async function handleMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";

    const typingId = appendTypingIndicator();

    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text, faqContext: faqData })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);
        appendMessage("bot", data.reply);
    } catch (err) {
        removeTypingIndicator(typingId);
        appendMessage("bot", "Network connection error. Please check your connection.");
    }
}

function appendMessage(sender, text) {
    const container = document.getElementById("chat-container");
    if (!container) return;

    const div = document.createElement("div");
    div.classList.add("message", sender === "user" ? "user-message" : "bot-message");

    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/(?<!href="|">)(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="chat-link">$1</a>');

    div.innerHTML = formatted;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
    const container = document.getElementById("chat-container");
    if (!container) return null;
    const div = document.createElement("div");
    div.id = "typing-indicator";
    div.classList.add("message", "bot-message");
    div.innerHTML = "<em>AIMST AskMeLah! is thinking...</em>";
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return "typing-indicator";
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}