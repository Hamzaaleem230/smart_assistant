import { NextResponse } from "next/server";
import abdul from "@/data/abdulAhad.json"; // adjust path if needed

// Check if message is related to Abdul Ahad
function looksLikeAbdulQuestion(text: string) {
  if (!text) return false;
  const t = text.toLowerCase();
  const keywords = [
    "abdul ahad",
    "sheikh abdul ahad",
    "who made you",
    "who created you",
    "tumhain kis ne banaya",
    "kis ne banaya",
    "who is abdul",
    "contact abdul",
    "contact ahad",
    "how to contact",
    "email of abdul",
    "abdul ahad contact",
    "contact details",
    "who built you",
    "creator",
    "developer",
    "skills",
    "achievements"
  ];
  return keywords.some(k => t.includes(k));
}

// Craft proper reply based on question type
function craftAbdulReply(text: string) {
  const t = text.toLowerCase();

  const name = abdul.name;
  const title = abdul.title;
  const summary = abdul.summary;
  const skills = abdul.skills.join(", ");
  const achievements = abdul.achievements.join("; ");
  const contactLine = abdul.contact?.email
    ? `Aap unse contact kar sakte hain: ${abdul.contact.email}`
    : abdul.short_contact_reply;

  // 1️⃣ Contact question → sirf email
  if (t.includes("contact") || t.includes("email") || t.includes("how to contact") || t.includes("contact details")) {
    return `${contactLine}`;
  }

  // 2️⃣ Who made you / creator
  if (
    t.includes("who made you") ||
    t.includes("who created you") ||
    t.includes("tumhain kis ne banaya") ||
    t.includes("kis ne banaya") ||
    t.includes("who built you") ||
    t.includes("creator")
  ) {
    return `Mujhe ${name} ne banaya, jo aik ${title} hain. Agar aap unse contact karna chahte hain to ${contactLine}.`;
  }

  // 3️⃣ Skills / achievements questions
  if (t.includes("skills") || t.includes("achievements")) {
    let reply = `${name} ke kuch important skills: ${skills}.`;
    reply += ` Unki achievements me shamil hain: ${achievements}.`;
    reply += ` Agar aap unse contact karna chahte hain to ${contactLine}.`;
    return reply;
  }

  // 4️⃣ General fallback (friendly, concise)
  return `${name} aik ${title} hain. Agar aap unse contact karna chahte hain to ${contactLine}.`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1️⃣ Local knowledge check
    if (looksLikeAbdulQuestion(message)) {
      const reply = craftAbdulReply(message);
      return NextResponse.json({ response: reply });
    }

    // 2️⃣ Gemini API key missing
    if (!apiKey) {
      return NextResponse.json({ response: "❌ Gemini API key not found" });
    }

    // 3️⃣ Call Gemini API for other questions
    const systemPrompt = `
Tum ek smart aur friendly AI ho jiska naam "Inquister" hai.
Tum hamesha Urdu Roman me baat karte ho (English mix allowed).
Tumhara style natural, polite, aur thoda modern ho.
Kisi bhi sawal ka jawab concise, friendly aur tameez se do.
Kabhi unnecessarily lambi biography ya achievements mat do.
Agar user specific skills/achievements maange, tab medium detail me batao.
Agar user kisi specific shakhsi ya contact ke baare me poochy to pehle local knowledge check karo aur phir concise reply do.
Kabhi ye mat kehna ke tum ek language model ho.
`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `User: ${message}\nInquister:` },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Koi response nahi mila";
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("🔥 API Error:", error);
    return NextResponse.json({ response: "❌ Server error occurred" }, { status: 500 });
  }
}
