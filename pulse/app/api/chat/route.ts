import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, hasAttachments } = await request.json();

    console.log("📨 Received message with attachments:", hasAttachments);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Pulse, a compassionate medical AI assistant specialized in:

🏥 **Medical Report Analysis:**
- Reading and interpreting lab results, prescriptions, and medical documents
- Explaining medical terminology in simple, patient-friendly language
- Identifying key findings and abnormal values
- Highlighting important medications, dosages, and instructions

📋 **Your Analysis Approach:**
1. First, acknowledge what document/report you're analyzing
2. Summarize the key findings in simple terms
3. Explain any medical terms or abbreviations
4. Highlight any concerning values or important instructions
5. Answer the user's specific questions about the report
6. Provide general health guidance related to the findings

⚠️ **Important Guidelines:**
- Always be empathetic and reassuring
- Explain things as if talking to a friend, not a medical textbook
- Use emojis sparingly to make information digestible
- Highlight critical information clearly
- Always remind users to follow their doctor's advice
- Never provide definitive diagnoses - only explain what the reports show

When you see extracted text from medical documents:
- Parse through it carefully
- Identify patient info, test results, diagnoses, prescriptions
- Explain what each medication is for (if prescribed)
- Note any abnormal lab values and explain what they mean
- Provide context about follow-up care if mentioned

Be warm, clear, and professional. Your goal is to help patients understand their medical documents and feel empowered about their health.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't process your request. Please try again.";

    console.log("✅ AI Response generated");

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("❌ Chat API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process your message.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}