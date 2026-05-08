"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Veltro, your personal AI assistant. Ask me anything or type /image followed by your description to generate an image! 🚀" }
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
      if (text.toLowerCase().startsWith("/image ")) {
        const prompt = text.slice(7);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
        setMessages([...updated, {
          role: "assistant",
          content: `__image__${imageUrl}__caption__Here's your image for: "${prompt}"`
        }]);
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
        });
        const data = await res.json();
        const reply = data.reply || "Sorry, I couldn't respond.";
        setMessages([...updated, { role: "assistant", content: reply }]);
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderMessage = (content) => {
    if (content.startsWith("__image__")) {
      const parts = content.split("__caption__");
      const imageUrl = parts[0].replace("__image__", "");
      const caption = parts[1];
      return (
        <div>
          <img src={imageUrl} alt={caption} style={{ width: "100%", borderRadius: 12, marginBottom: 8, border: "1px solid rgba(96,165,250,0.3)" }} />
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{caption}</p>
        </div>
      );
    }
    return content;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020818 0%, #05110a 50%, #071020 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: 20,
    }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.3); border-radius: 3px; }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        button { cursor: pointer; border: none; transition: all 0.15s ease; }
        button:hover { opacity: 0.85; transform: scale(0.98); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 740, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #1d4ed8, #4ade80)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 20px rgba(96,165,250,0.4)",
          }}>V</div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #4ade80, #60a5fa, #ffffff)",
              backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite",
            }}>Veltro</h1>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(96,165,250,0.7)", letterSpacing: "1px" }}>AI ASSISTANT</p>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "Chat cleared! I'm Veltro, ready to help 🚀" }])}
          style={{
            background: "rgba(96,165,250,0.08)", color: "rgba(96,165,250,0.8)",
            padding: "7px 16px", borderRadius: 10, fontSize: 12,
            border: "1px solid rgba(96,165,250,0.2)",
          }}>Clear</button>
      </div>

      <div style={{
        width: "100%", maxWidth: 740, marginBottom: 10,
        background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
        borderRadius: 10, padding: "8px 14px", fontSize: 12,
        color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: "#4ade80" }}>🖼️</span>
        Type <span style={{ color: "#4ade80", fontWeight: 600 }}>&nbsp;/image your description&nbsp;</span> to generate an image
      </div>

      <div style={{
        width: "100%", maxWidth: 740, height: "58vh",
        background: "rgba(255,255,255,0.02)", borderRadius: 20,
        border: "1px solid rgba(96,165,250,0.15)", overflowY: "auto",
        padding: "20px 20px 10px",
        boxShadow: "0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(96,165,250,0.1)",
      }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
              {!isUser && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg, #1d4ed8, #4ade80)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginRight: 10, flexShrink: 0, fontSize: 13, fontWeight: 900,
                  color: "#fff", alignSelf: "flex-end",
                }}>V</div>
              )}
              <div style={{
                maxWidth: "74%", padding: "12px 16px", fontSize: 15, lineHeight: 1.65,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: isUser ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "rgba(255,255,255,0.05)",
                color: isUser ? "#fff" : "rgba(255,255,255,0.88)",
                borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                border: isUser ? "none" : "1px solid rgba(96,165,250,0.15)",
                boxShadow: isUser ? "0 4px 20px rgba(29,78,216,0.35)" : "none",
              }}>{renderMessage(msg.content)}</div>
              {isUser && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #4ade80)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginLeft: 10, flexShrink: 0, fontSize: 13, fontWeight: 900,
                  color: "#fff", alignSelf: "flex-end",
                }}>Y</div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>V</div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: "20px 20px 20px 4px", padding: "14px 18px", display: "flex", gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#60a5fa", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        width: "100%", maxWidth: 740, marginTop: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(96,165,250,0.25)",
        borderRadius: 16, display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 14px",
        boxShadow: "0 0 20px rgba(96,165,250,0.05)",
      }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask Veltro anything… or type /image to generate images"
          rows={1}
          style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 15, lineHeight: 1.6, resize: "none", fontFamily: "inherit", maxHeight: 120, overflowY: "auto" }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? "linear-gradient(135deg,#1d4ed8,#4ade80)" : "rgba(255,255,255,0.06)",
            color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)",
            width: 40, height: 40, borderRadius: 12, fontSize: 18, fontWeight: 700,
            boxShadow: input.trim() && !loading ? "0 4px 15px rgba(96,165,250,0.3)" : "none",
          }}>➤</button>
      </div>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 10 }}>
        Veltro can make mistakes. Verify important info.
      </p>
    </div>
  );
}
