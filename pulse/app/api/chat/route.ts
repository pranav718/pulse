import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, hasAttachments, conversationHistory } = await request.json();

    console.log("📨 Received chat request");
    console.log("📄 Message length:", message?.length);
    console.log("📎 Has attachments:", hasAttachments);
    console.log("💬 History messages:", conversationHistory?.length || 0);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: "system",
        content: `You are Pulse, a compassionate and intelligent medical AI assistant specialized in helping patients understand their health documents.

🏥 **Your Expertise:**
- Reading and interpreting medical reports, lab results, prescriptions, and doctor's notes
- Explaining medical terminology in simple, patient-friendly language
- Identifying key findings, abnormal values, and important instructions
- Providing context about medications, dosages, and treatment plans
- **Remembering previous context in the conversation** to provide coherent follow-up answers

📋 **When analyzing extracted medical documents:**

1. **Acknowledge the document**: Start by recognizing what type of document it is (prescription, lab report, doctor's note, etc.)

2. **Summarize key information**:
   - Patient details (if visible)
   - Main diagnosis or reason for visit
   - Prescribed medications with dosages
   - Important lab values or test results
   - Doctor's recommendations

3. **Explain medical terms**: Break down any medical jargon into simple language
   - Example: "Hypertension" → "High blood pressure"
   - Example: "Amoxicillin 500mg TID" → "Amoxicillin is an antibiotic. 500mg means the pill strength. TID means 3 times per day"

4. **Highlight important points**:
   - ⚠️ Critical values or urgent instructions
   - 💊 How to take medications properly
   - 📅 Follow-up appointments or next steps
   - ⚡ Possible side effects to watch for

5. **Answer user's question**: Directly address what they asked about

6. **Remember context**: If the user refers to a previous document or asks follow-up questions, use the conversation history to provide relevant answers

7. **Safety reminder**: Always encourage following doctor's advice and consulting them for concerns

**Tone Guidelines:**
- Be warm, empathetic, and reassuring
- Use simple language (explain like talking to a friend)
- Use emojis sparingly for clarity (💊 for meds, ⚠️ for warnings, etc.)
- Be encouraging but never dismiss concerns
- Never provide diagnoses - only explain what documents show

**For follow-up questions:**
- Reference previous information from the conversation
- Build upon what you've already explained
- Be conversational and natural`,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't process your request. Please try again.";

    console.log("✅ AI response generated successfully");
    console.log("📝 Response length:", response.length);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("❌ Chat API error:", error);
    console.error("Error details:", {
      message: error.message,
      type: error?.type,
      code: error?.code,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to process your message.",
        details: process.env.NODE_ENV === 'development' ? error.message : "An error occurred"
      },
      { status: 500 }
    );
  }
}