"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. Ask me anything 🚀" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't respond.";
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "Georgia, serif", padding: 20,
    }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(148,163,184,0.5); }
        button { cursor: pointer; border: none; transition: all 0.15s ease; }
        button:hover { opacity: 0.85; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 720, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 700,
            background: "linear-gradient(90deg, #6ee7b7, #3b82f6, #a78bfa)",
            backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
          }}>✦ My AI Assistant</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(148,163,184,0.6)" }}>Powered by Groq</p>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "Chat cleared! Ask me anything 🚀" }])}
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.8)", padding: "7px 14px", borderRadius: 10, fontSize: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
          Clear
        </button>
      </div>

      <div style={{
        width: "100%", maxWidth: 720, height: "60vh",
        background: "rgba(255,255,255,0.03)", borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: "20px 20px 10px",
      }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
              {!isUser && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6ee7b7,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#fff", alignSelf: "flex-end" }}>A</div>
              )}
              <div style={{
                maxWidth: "72%", padding: "12px 16px", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: isUser ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.06)",
                color: isUser ? "#fff" : "#e2e8f0",
                borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>{msg.content}</div>
              {isUser && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f472b6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 10, flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#fff", alignSelf: "flex-end" }}>Y</div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6ee7b7,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>A</div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 20px 4px", padding: "14px 18px", display: "flex", gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#6ee7b7", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        width: "100%", maxWidth: 720, marginTop: 12,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 14px",
      }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask me anything… (Enter to send)"
          rows={1}
          style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 15, lineHeight: 1.6, resize: "none", fontFamily: "inherit", maxHeight: 120, overflowY: "auto" }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{ background: input.trim() && !loading ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.08)", color: input.trim() && !loading ? "#fff" : "rgba(148,163,184,0.4)", width: 40, height: 40, borderRadius: 12, fontSize: 18 }}>
          ➤
        </button>
      </div>
      <p style={{ color: "rgba(148,163,184,0.35)", fontSize: 11, marginTop: 10 }}>AI can make mistakes. Verify important info.</p>
    </div>
  );
                                                            }
