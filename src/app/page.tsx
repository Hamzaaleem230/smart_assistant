"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // ✅ Dark mode toggle (with localStorage)
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // ✅ Load old chat (optional)
  useEffect(() => {
    const savedChat = localStorage.getItem("inquister-chat");
    if (savedChat) setMessages(JSON.parse(savedChat));
  }, []);

  // ✅ Save chat automatically
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("inquister-chat", JSON.stringify(messages));
    }
  }, [messages]);

  const playSound = () => {
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/02/15/audio_444f96b1df.mp3?filename=notification-pop-96104.mp3"
    );
    audio.play();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBoxRef.current?.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 150);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: `🧑‍💻 You: ${input}` };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `🤖 Inquister: ${data.response}` },
      ]);
      playSound();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "error", text: `❌ Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("inquister-chat");
  };

  const exportChat = () => {
    const text = messages.map((m) => m.text).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inquister_chat.txt";
    a.click();
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <img id="logo" src="/logo.jpg" alt="logo" />
        <h1>Inquister</h1>
        <button className="toggle-theme" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      {/* CHAT SECTION */}
      <main className="chat-wrapper">
        <div ref={chatBoxRef} id="chat-box" className="chat-box">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`bubble ${msg.sender}`}
              style={{
                animation: "fadeIn 0.3s ease",
              }}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="bubble bot">
              🤖 Inquister:
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="input-area">
          <input
            id="message"
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>

        {/* ACTION BUTTONS */}
        <div className="action-buttons">
          <button onClick={clearChat}>🧹 Clear</button>
          <button onClick={exportChat}>💾 Export</button>
        </div>
      </main>
    </div>
  );
}
