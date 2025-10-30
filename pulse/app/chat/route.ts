// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractTextFromPDF } from "@/lib/pdf-utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, attachments } = await request.json();

    console.log("📨 Received request:", { 
      message, 
      attachmentsCount: attachments?.length || 0,
      attachmentTypes: attachments?.map((a: any) => ({ type: a.type, name: a.name }))
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build the message content
    let messageContent: any = message;
    let model = "gpt-4o-mini"; // Default model

    if (attachments && attachments.length > 0) {
      const contentParts: any[] = [
        {
          type: "text",
          text: message,
        },
      ];

      // Process each attachment
      for (const attachment of attachments) {
        console.log(`Processing attachment: ${attachment.name} (${attachment.type})`);

        if (attachment.type === "image") {
          model = "gpt-4o"; // Switch to vision model for images
          
          // Validate base64 image
          if (attachment.url && attachment.url.startsWith('data:image')) {
            contentParts.push({
              type: "image_url",
              image_url: {
                url: attachment.url,
                detail: "high",
              },
            });
            console.log("✅ Added image attachment:", attachment.name);
          } else {
            console.error("❌ Invalid image URL format:", attachment.name);
          }
        } else if (attachment.type === "file") {
          console.log("📄 Extracting text from PDF:", attachment.name);
          
          // Extract PDF text
          const extractedText = await extractTextFromPDF(attachment.url);
          
          console.log(`📄 Extracted ${extractedText.length} characters from PDF`);
          
          contentParts[0].text += `\n\n📎 **File: ${attachment.name}**\n\nExtracted Content:\n${extractedText}`;
        }
      }

      messageContent = contentParts;
    }

    console.log("🤖 Using model:", model);
    console.log("📤 Sending to OpenAI with content parts:", 
      typeof messageContent === 'string' ? 'text-only' : `${messageContent.length} parts`
    );

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are Pulse, an intelligent medical AI assistant specialized in:
- Analyzing medical reports, lab results, and medical images
- Explaining medical terminology in simple, patient-friendly language
- Identifying key findings and abnormal values
- Providing health guidance while emphasizing the importance of professional medical consultation

When analyzing medical images or PDFs:
1. Carefully examine all visible information
2. Identify and explain any abnormal findings or values
3. For lab reports: highlight values outside normal ranges
4. Explain medical terms in plain language
5. Provide context about what the findings might mean
6. Always recommend consulting a healthcare provider for diagnosis and treatment

For extracted PDF text:
- Parse through the medical information systematically
- Identify key sections (patient info, test results, diagnoses, recommendations)
- Highlight abnormal values and concerning findings
- Explain medical abbreviations and terminology

Be empathetic, clear, and professional. Never provide definitive diagnoses.`,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't process your request. Please try again.";

    console.log("✅ Response generated successfully");

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("❌ Chat API error:", error);
    console.error("Error details:", {
      message: error.message,
      type: error?.type,
      code: error?.code,
      stack: error?.stack?.substring(0, 500),
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