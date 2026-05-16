export async function POST(req) {
  const { messages, system } = await req.json();

  const systemPrompt = system || "You are Veltro, a sharp, intelligent and professional AI assistant. You give clear, direct, and genuinely useful answers. You adapt your tone to the user — formal when they are, casual when they are. You never pad responses with filler.";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";
  return Response.json({ reply });
}
