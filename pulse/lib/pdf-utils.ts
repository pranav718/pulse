// lib/pdf-utils.ts
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Remove data URL prefix
    const base64 = base64Data.split(',')[1] || base64Data;
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;

    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const text = fullText.trim();
    
    if (text.length > 0) {
      // Limit to first 4000 chars to avoid token limits
      return text.substring(0, 4000) + (text.length > 4000 ? "\n\n[...text truncated for length...]" : "");
    }
    
    return `[PDF Document - ${pdf.numPages} pages, no text could be extracted. This may be an image-based PDF.]`;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "[Unable to read PDF content. Please try uploading as an image or describing the content.]";
  }
}