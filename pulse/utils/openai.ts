import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful health assistant. Provide accurate, empathetic health information. Always remind users to consult healthcare professionals for serious concerns.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
}

export async function explainReport(reportText: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical report interpreter. Explain medical reports in simple, patient-friendly language. Highlight key findings and suggest when to consult a doctor.",
        },
        {
          role: "user",
          content: `Please explain this medical report in simple terms:\n\n${reportText}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "Could not analyze the report.";
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Error analyzing report. Please try again.";
  }
}