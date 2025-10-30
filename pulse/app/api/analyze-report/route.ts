import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert medical report analyzer. Extract:
1. A concise summary (2-3 sentences)
2. Key findings categorized as: normal, abnormal, or critical
3. Severity levels for abnormal/critical findings

Return ONLY valid JSON:
{
  "summary": "...",
  "keyFindings": [
    {
      "category": "normal|abnormal|critical",
      "text": "...",
      "severity": "low|medium|high"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Analyze:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}