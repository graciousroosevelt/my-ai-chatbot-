"use client";
import { useState, useRef, useEffect } from "react";

const suggestions = [
  { label: "Write", text: "Write a professional executive summary for my business", icon: "✍️" },
  { label: "Explain", text: "Explain how neural networks learn from data", icon: "🧠" },
  { label: "Ideate", text: "Give me 10 disruptive startup ideas for 2026", icon: "💡" },
  { label: "Create", text: "/image a cinematic dark luxury penthouse at night", icon: "🖼️" },
];

const initMessages = [{ role: "assistant", content: "What can I help you with today?" }];

export default function Home() {
  const [messages, setMessages] = useState(initMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (override) => {
    const msg = (override || input).trim();
    if (!msg || loading) return;
    setInput("");
    setShowWelcome(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: msg };
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
      if (msg.toLowerCase().startsWith("/image ")) {
        const prompt = msg.slice(7);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=512&nologo=true`;
        setMessages([...updated, { role: "assistant", content: `__image__${imageUrl}__caption__Generated: "${prompt}"` }]);
      } else {
        const reply = data.reply || "Sorry, I couldn't respond.";
        setMessages([...updated, { role: "assistant", content: reply }]);
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newChat = () => {
    setMessages(initMessages);
    setShowWelcome(true);
    setInput("");
  };

  const handleMainClick = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  const renderMessage = (content) => {
    if (content.startsWith("__image__")) {
      const parts = content.split("__caption__");
      const imageUrl = parts[0].replace("__image__", "");
      const caption = parts[1];
      return (
        <div>
          <img src={imageUrl} alt={caption} style={{ width: "100%", borderRadius: 14, marginBottom: 8, border: "1px solid rgba(99,179,237,0.2)" }} />
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>{caption}</p>
        </div>
      );
    }
    return content;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "#080c14", fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif", overflow: "hidden", color: "#e8e8e8" }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:4px; }
        textarea { outline:none; }
        textarea::placeholder { color:rgba(255,255,255,0.18); }
        button { cursor:pointer; border:none; font-family:inherit; }
        .nav-item:hover { background:rgba(255,255,255,0.06) !important; color:rgba(255,255,255,0.85) !important; }
        .card-btn:hover { background:rgba(255,255,255,0.07) !important; border-color:rgba(99,179,237,0.25) !important; transform:translateY(-1px); }
        .card-btn { transition:all 0.18s ease !important; }
        .send-btn:hover:not(:disabled) { transform:scale(1.05); box-shadow:0 6px 24px rgba(26,92,255,0.5) !important; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: "hidden", transition: "width 0.25s ease, min-width 0.25s ease", background: "rgba(255,255,255,0.022)", borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", flexDirection: "column", padding: sidebarOpen ? "22px 14px" : "0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingLeft: 4, opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #1a5cff 0%, #00c896 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 0 20px rgba(26,92,255,0.35)" }}>V</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", background: "linear-gradient(90deg, #63b3ed, #4ade80, #a78bfa)", backgroundSize: "300%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 6s linear infinite" }}>Veltro</div>
            <div style={{ fontSize: 9, color: "rgba(99,179,237,0.5)", letterSpacing: "1.5px", marginTop: 1 }}>AI ASSISTANT</div>
          </div>
        </div>

        <button onClick={newChat} className="nav-item" style={{ background: "linear-gradient(135deg, rgba(26,92,255,0.18), rgba(0,200,150,0.12))", border: "1px solid rgba(99,179,237,0.18)", color: "rgba(255,255,255,0.8)", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 9, marginBottom: 24, transition: "all 0.15s" }}>
          <span style={{ fontSize: 17, color: "#4ade80" }}>+</span> New conversation
        </button>

        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "1.2px", paddingLeft: 6, marginBottom: 6 }}>RECENTS</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", paddingLeft: 6, marginBottom: 24, fontStyle: "italic" }}>No recent chats</div>

        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "1.2px", paddingLeft: 6, marginBottom: 8 }}>QUICK START</div>
        {suggestions.map((s, i) => (
          <button key={i} className="nav-item" onClick={() => { setInput(s.text); textareaRef.current?.focus(); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.38)", padding: "9px 8px", borderRadius: 8, fontSize: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{ color: "rgba(99,179,237,0.7)", fontWeight: 600, marginRight: 2 }}>{s.label}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14, paddingLeft: 6 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", lineHeight: 1.9 }}>Powered by Groq LLaMA<br /><span style={{ color: "rgba(0,200,150,0.35)" }}>veltro.ai</span></div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }} onClick={handleMainClick}>
        <div style={{ position: "absolute", top: -100, left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,92,255,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -100, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,150,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 10, backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", width: 34, height: 34, borderRadius: 9, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} className="nav-item">☰</button>
            {!sidebarOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #1a5cff, #00c896)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>V</div>
                <span style={{ fontSize: 14, fontWeight: 700, background: "linear-gradient(90deg, #63b3ed, #4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Veltro</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.12)", padding: "5px 12px", borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c896", animation: "glowPulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(0,200,150,0.7)", fontWeight: 500 }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>
          {showWelcome ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "40px 24px", animation: "fadeUp 0.4s ease" }}>
              <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg, #1a5cff 0%, #00c896 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#fff", boxShadow: "0 0 60px rgba(26,92,255,0.3), 0 0 120px rgba(0,200,150,0.15)", marginBottom: 24 }}>V</div>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 8, background: "linear-gradient(90deg, #fff 30%, #63b3ed 60%, #4ade80 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>How can I help?</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.28)", marginBottom: 36, textAlign: "center" }}>Ask anything. Think fast. Get clarity.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 580 }}>
                {suggestions.map((s, i) => (
                  <button key={i} className="card-btn" onClick={(e) => { e.stopPropagation(); setInput(s.text); textareaRef.current?.focus(); }} style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", textAlign: "left", color: "rgba(255,255,255,0.65)" }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(99,179,237,0.8)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.4)" }}>{s.text}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 28px" }}>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 14, marginBottom: 30, animation: "fadeUp 0.25s ease" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isUser ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #1a5cff, #00c896)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isUser ? "rgba(255,255,255,0.5)" : "#fff", border: isUser ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: isUser ? "none" : "0 2px 12px rgba(26,92,255,0.25)" }}>{isUser ? "Y" : "V"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.22)", marginBottom: 7, textAlign: isUser ? "right" : "left", letterSpacing: "0.3px" }}>{isUser ? "You" : "Veltro"}</div>
                      <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", color: isUser ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.88)", textAlign: isUser ? "right" : "left" }}>{renderMessage(msg.content)}</div>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #1a5cff, #00c896)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>V</div>
                  <div style={{ paddingTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.22)", marginBottom: 10 }}>Veltro</div>
                    <div style={{ display: "flex", gap: 5 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#1a5cff,#00c896)", animation: `bounce 1.1s ease-in-out ${i*0.17}s infinite` }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "14px 24px 18px", position: "relative", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingLeft: 2 }}>
              <span style={{ fontSize: 11, color: "rgba(99,179,237,0.4)" }}>🖼️</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Type <span style={{ color: "rgba(99,179,237,0.5)" }}>/image your prompt</span> to generate an image</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,179,237,0.15)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Message Veltro…" rows={1} style={{ width: "100%", background: "transparent", border: "none", color: "#e8e8e8", fontSize: 15, lineHeight: 1.65, resize: "none", fontFamily: "inherit", maxHeight: 180, overflowY: "auto", display: "block" }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px"; }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.12)" }}>Enter to send · Shift+Enter for new line</span>
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="send-btn" style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading ? "linear-gradient(135deg, #1a5cff, #00c896)" : "rgba(255,255,255,0.05)", color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, boxShadow: input.trim() && !loading ? "0 4px 18px rgba(26,92,255,0.35)" : "none", transition: "all 0.2s" }}>➤</button>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 9, fontSize: 11, color: "rgba(255,255,255,0.09)" }}>Veltro may make mistakes. Verify critical information independently.</div>
          </div>
        </div>
      </div>
    </div>
  );
      }
