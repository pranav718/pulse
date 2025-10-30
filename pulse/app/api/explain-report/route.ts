import { NextRequest, NextResponse } from "next/server";
import { explainReport } from "@/utils/openai";

export async function POST(request: NextRequest) {
  try {
    const { reportText } = await request.json();

    if (!reportText) {
      return NextResponse.json(
        { error: "Report text is required" },
        { status: 400 }
      );
    }

    const summary = await explainReport(reportText);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Explain report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}