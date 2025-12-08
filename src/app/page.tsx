"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // ✅ Dark mode body class effect
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // ✅ Default welcome message (runs once on load)
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "🤖 Inquister: Hi there! I’m Inquister — your smart AI companion. Ask me anything, and I’ll try to help you with quick and clear answers! 😊",
      },
    ]);
  }, []);

  const playSound = () => {
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/02/15/audio_444f96b1df.mp3?filename=notification-pop-96104.mp3"
    );
    audio.play();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: `🧑‍💻 You: ${input}` };
    setMessages((prev) => [...prev, userMessage]);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBoxRef.current?.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const clearChat = () => setMessages([]);

  const exportChat = () => {
    const text = messages.map((m) => m.text).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat.txt";
    a.click();
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <img id="logo" src="/logo.jpg" alt="logo" />
        <h1>Inquister</h1>
        <button className="toggle-theme" onClick={() => setDarkMode(!darkMode)}>
          🌙 Toggle
        </button>
      </header>

      {/* CHAT SECTION */}
      <main className="chat-wrapper">
        <div ref={chatBoxRef} id="chat-box" className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.sender}`}>
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
          <button onClick={sendMessage}>Send</button>
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
