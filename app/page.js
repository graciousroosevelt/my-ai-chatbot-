"use client";
import { useState, useRef, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────
const CHATS_KEY = "veltro_chats_v3";
const MEMORY_KEY = "veltro_memory_v1";

const C = {
  bg: "#080a08",
  sidebar: "#0d110d",
  surface: "#111611",
  border: "rgba(34,197,94,0.1)",
  borderHover: "rgba(34,197,94,0.22)",
  green: "#16a34a",
  greenBright: "#22c55e",
  greenDim: "rgba(22,163,74,0.12)",
  blue: "#1d4ed8",
  blueDim: "rgba(29,78,216,0.12)",
  text: "#f0f0f0",
  textMuted: "rgba(255,255,255,0.35)",
  textDim: "rgba(255,255,255,0.15)",
};

const SUGGESTIONS = [
  { label: "Write", text: "Write a professional executive summary for my business", icon: "✍️" },
  { label: "Explain", text: "Explain how neural networks learn from data", icon: "🧠" },
  { label: "Ideate", text: "Give me 10 disruptive startup ideas for 2026", icon: "💡" },
  { label: "Image", text: "/image a cinematic dark luxury penthouse at night", icon: "🖼️" },
];

// ── Storage helpers ────────────────────────────────────────
function loadChats() {
  try { return JSON.parse(localStorage.getItem(CHATS_KEY) || "[]"); } catch { return []; }
}
function saveChats(c) {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(c)); } catch {}
}
function loadMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]"); } catch { return []; }
}
function saveMemory(m) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)); } catch {}
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getChatTitle(messages) {
  const first = messages.find(m => m.role === "user");
  if (!first) return "New conversation";
  return first.content.replace("/image ", "🖼️ ").slice(0, 36) + (first.content.length > 36 ? "…" : "");
}

// ── Memory extraction via AI ───────────────────────────────
async function extractMemory(messages, existingMemory) {
  try {
    const last = messages.slice(-6);
    const convo = last.map(m => `${m.role === "user" ? "User" : "Veltro"}: ${m.content}`).join("\n");
    const existing = existingMemory.map(m => m.fact).join(". ");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `You are a memory extraction system. Analyze this conversation and extract any NEW facts about the user (profession, interests, preferences, life changes, personality, location, goals etc).

Existing memory: ${existing || "none yet"}

Recent conversation:
${convo}

Rules:
- Only extract genuinely new or updated facts not already in existing memory
- If something changed (e.g. user changed jobs), phrase it as evolution: "User was a designer but is now also a tailor"
- Return ONLY a JSON array of new fact strings, e.g. ["User is a designer", "User prefers short answers"]
- Return empty array [] if nothing new to learn
- Max 3 new facts per extraction
- Return ONLY the JSON array, nothing else`
        }],
        system: "You are a memory extraction assistant. Return only valid JSON arrays."
      }),
    });
    const data = await res.json();
    const raw = data.reply || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();
    const facts = JSON.parse(clean);
    if (!Array.isArray(facts)) return [];
    return facts.map(f => ({ id: genId(), fact: String(f), learnedAt: Date.now() }));
  } catch { return []; }
}

// ── Main Component ─────────────────────────────────────────
export default function Veltro() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [memory, setMemory] = useState([]);
  const [showMemory, setShowMemory] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setChats(loadChats());
    setMemory(loadMemory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persistChats = (updated) => { setChats(updated); saveChats(updated); };
  const persistMemory = (updated) => { setMemory(updated); saveMemory(updated); };

  const newChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setShowWelcome(true);
    setShowMemory(false);
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.focus(); }
  };

  const openChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setShowWelcome(false);
    setShowMemory(false);
    if (sidebarOpen) setSidebarOpen(false);
  };

  const clearAllMemory = () => {
    persistMemory([]);
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setShowWelcome(false);
    setShowMemory(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    let reply = "";
    try {
      if (msg.toLowerCase().startsWith("/image ")) {
        // Image generation — checked FIRST
        const prompt = msg.slice(7).trim();
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=512&nologo=true&seed=${Date.now()}`;
        reply = `__image__${imageUrl}__caption__${prompt}`;
      } else {
        // Build memory context
        const memoryContext = memory.length > 0
          ? `\n\nWhat you know about this user (use naturally, don't mention you have a memory system):\n${memory.map(m => `- ${m.fact}`).join("\n")}`
          : "";

        const systemPrompt = `You are Veltro, a sharp, intelligent and professional AI assistant. You give clear, direct, and genuinely useful answers. You adapt your tone to the user — formal when they are, casual when they are. You never pad responses with filler.${memoryContext}`;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated.map(m => ({ role: m.role, content: m.content })),
            system: systemPrompt,
          }),
        });
        const data = await res.json();
        reply = data.reply || "Sorry, I couldn't respond. Please try again.";
      }
    } catch {
      reply = "Connection error. Please check your internet and try again.";
    }

    const final = [...updated, { role: "assistant", content: reply }];
    setMessages(final);
    setLoading(false);

    // Save chat
    const chatId = activeChatId || genId();
    if (!activeChatId) setActiveChatId(chatId);
    const idx = chats.findIndex(c => c.id === chatId);
    const updatedChat = { id: chatId, messages: final, updatedAt: Date.now() };
    persistChats(idx >= 0 ? chats.map((c, i) => i === idx ? updatedChat : c) : [updatedChat, ...chats]);

    // Extract memory silently after every 3rd message
    if (final.filter(m => m.role === "user").length % 3 === 0 && !msg.startsWith("/image")) {
      const newFacts = await extractMemory(final, memory);
      if (newFacts.length > 0) {
        const updatedMemory = [...memory, ...newFacts];
        persistMemory(updatedMemory);
      }
    }
  };

  // Enter = new line only. Only send button sends.
  const handleKey = (e) => { /* intentionally blank */ };

  const handleMainClick = () => { if (sidebarOpen) setSidebarOpen(false); };

  const renderMessage = (content) => {
    if (content.startsWith("__image__")) {
      const parts = content.split("__caption__");
      const url = parts[0].replace("__image__", "");
      const cap = parts[1] || "";
      return (
        <div style={{ userSelect: "text" }}>
          <img src={url} alt={cap}
            style={{ width: "100%", maxWidth: 460, borderRadius: 10, display: "block", marginBottom: 8, border: `1px solid ${C.border}` }}
            onError={e => { e.target.style.display = "none"; }} />
          {cap && <p style={{ margin: 0, fontSize: 12, color: C.textDim, fontStyle: "italic" }}>"{cap}"</p>}
        </div>
      );
    }
    return <span style={{ userSelect: "text" }}>{content}</span>;
  };

  const grouped = {
    today: chats.filter(c => Date.now() - c.updatedAt < 86400000),
    week: chats.filter(c => Date.now() - c.updatedAt >= 86400000 && Date.now() - c.updatedAt < 604800000),
    older: chats.filter(c => Date.now() - c.updatedAt >= 604800000),
  };

  const ChatGroup = ({ label, items }) => !items.length ? null : (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "1.3px", padding: "0 8px", marginBottom: 4 }}>{label}</div>
      {items.map(chat => (
        <div key={chat.id} onClick={() => openChat(chat)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 1, background: activeChatId === chat.id ? C.greenDim : "transparent", borderLeft: `2px solid ${activeChatId === chat.id ? C.green : "transparent"}`, transition: "all 0.12s", userSelect: "none" }}
          onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: 12, color: activeChatId === chat.id ? C.greenBright : C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{getChatTitle(chat.messages)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: C.bg, fontFamily: "-apple-system,'SF Pro Text','Segoe UI',sans-serif", overflow: "hidden", color: C.text, userSelect: "none" }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(34,197,94,0.15); border-radius:3px; }
        textarea { outline:none; caret-color:${C.greenBright}; }
        textarea::placeholder { color:rgba(255,255,255,0.18); }
        button { cursor:pointer; border:none; font-family:inherit; user-select:none; }
        img { user-select:none; -webkit-user-drag:none; }
        .send-btn:hover:not(:disabled) { background:${C.greenBright} !important; }
        .send-btn:active:not(:disabled) { transform:scale(0.95); }
        .new-chat-btn:hover { background:rgba(34,197,94,0.08) !important; border-color:${C.borderHover} !important; }
        .suggest-card:hover { background:rgba(34,197,94,0.06) !important; border-color:${C.borderHover} !important; }
        .toggle-btn:hover { background:rgba(34,197,94,0.08) !important; }
        .mem-btn:hover { background:rgba(34,197,94,0.08) !important; }
        .input-box:focus-within { border-color:rgba(34,197,94,0.3) !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width: sidebarOpen ? 252 : 0, minWidth: sidebarOpen ? 252 : 0, overflow: "hidden", transition: "width 0.2s ease, min-width 0.2s ease", background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "18px 12px", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.15s" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "0 4px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 0 14px rgba(22,163,74,0.35)" }}>V</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>Veltro</div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: "1.5px" }}>AI ASSISTANT</div>
            </div>
          </div>

          {/* New Chat */}
          <button className="new-chat-btn" onClick={newChat}
            style={{ background: "rgba(34,197,94,0.05)", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.65)", padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 9, marginBottom: 20, transition: "all 0.15s" }}>
            <span style={{ fontSize: 17, color: C.greenBright, lineHeight: 1 }}>+</span> New conversation
          </button>

          {/* Chat History */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {chats.length === 0
              ? <div style={{ fontSize: 12, color: C.textDim, padding: "0 8px", fontStyle: "italic", lineHeight: 1.7 }}>Your conversations<br />will appear here</div>
              : <>
                  <ChatGroup label="TODAY" items={grouped.today} />
                  <ChatGroup label="THIS WEEK" items={grouped.week} />
                  <ChatGroup label="OLDER" items={grouped.older} />
                </>
            }
          </div>

          {/* Memory button */}
          <button className="mem-btn" onClick={() => { setShowMemory(!showMemory); setShowWelcome(false); }}
            style={{ background: showMemory ? C.greenDim : "transparent", border: `1px solid ${showMemory ? C.borderHover : "transparent"}`, color: showMemory ? C.greenBright : C.textMuted, padding: "9px 12px", borderRadius: 9, fontSize: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 8, marginBottom: 8, transition: "all 0.15s" }}>
            <span>🧠</span> Memory {memory.length > 0 && <span style={{ background: C.green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{memory.length}</span>}
          </button>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 2, paddingLeft: 4 }}>
              Powered by Groq LLaMA<br />
              <span style={{ color: C.green, fontWeight: 600 }}>veltro.ai</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={handleMainClick}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="toggle-btn" onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.textMuted, width: 32, height: 32, borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>☰</button>
            {!sidebarOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>V</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Veltro</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.greenBright, animation: "pulse 2.5s infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(34,197,94,0.7)", fontWeight: 500 }}>Online</span>
          </div>
        </div>

        {/* ── MEMORY VIEW ── */}
        {showMemory && (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", maxWidth: 800, margin: "0 auto", width: "100%", animation: "fadeUp 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🧠 Veltro's Memory</h2>
                <p style={{ fontSize: 13, color: C.textMuted }}>What Veltro has learned about you from your conversations.</p>
              </div>
              {memory.length > 0 && (
                <button onClick={clearAllMemory}
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.7)", padding: "7px 14px", borderRadius: 8, fontSize: 12, transition: "all 0.15s" }}>
                  Clear all memory
                </button>
              )}
            </div>

            {memory.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>No memories yet.<br />Chat with Veltro and it will start learning about you naturally.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {memory.map((m, i) => (
                  <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, animation: "fadeUp 0.2s ease" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: C.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.green, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, flex: 1, userSelect: "text" }}>{m.fact}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WELCOME ── */}
        {showWelcome && !showMemory && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", animation: "fadeUp 0.3s ease" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 22, boxShadow: "0 0 40px rgba(22,163,74,0.3)" }}>V</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" }}>How can I help?</h1>
            <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 36 }}>Ask anything. Fast answers. Real intelligence.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 560 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggest-card"
                  onClick={(e) => { e.stopPropagation(); setInput(s.text); setTimeout(() => textareaRef.current?.focus(), 10); }}
                  style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{s.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {!showWelcome && !showMemory && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 20px" }}>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, marginBottom: 28, animation: i >= messages.length - 2 ? "fadeUp 0.2s ease" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: isUser ? C.blueDim : C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: isUser ? "#60a5fa" : "#fff", border: isUser ? "1px solid rgba(29,78,216,0.2)" : "none", boxShadow: isUser ? "none" : "0 2px 10px rgba(22,163,74,0.25)" }}>
                      {isUser ? "Y" : "V"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: isUser ? "right" : "left", letterSpacing: "0.3px" }}>{isUser ? "You" : "Veltro"}</div>
                      <div style={{ fontSize: 15, lineHeight: 1.8, color: isUser ? "rgba(255,255,255,0.55)" : C.text, textAlign: isUser ? "right" : "left", whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: "text" }}>
                        {renderMessage(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: "flex", gap: 12, marginBottom: 28, animation: "fadeUp 0.2s ease" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>V</div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 8 }}>Veltro</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: `bounce 1s ease-in-out ${i*0.15}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* ── INPUT ── */}
        {!showMemory && (
          <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8, paddingLeft: 2 }}>
                🖼️ Type <span style={{ color: C.green, fontWeight: 600 }}>/image your description</span> to generate an image
              </div>
              <div className="input-box" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.2s" }}>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Message Veltro…" rows={1}
                  style={{ width: "100%", background: "transparent", border: "none", color: C.text, fontSize: 15, lineHeight: 1.65, resize: "none", fontFamily: "inherit", maxHeight: 200, overflowY: "auto" }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"; }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textDim }}>Enter for new line · Click ➤ to send</span>
                  <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}
                    style={{ background: input.trim() && !loading ? C.green : "rgba(255,255,255,0.04)", color: input.trim() && !loading ? "#fff" : C.textDim, width: 36, height: 36, borderRadius: 9, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0, boxShadow: input.trim() && !loading ? "0 2px 12px rgba(22,163,74,0.3)" : "none" }}>➤</button>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.07)" }}>
                Veltro may make mistakes. Verify critical information independently.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
