// lib/pdf-utils.ts
import * as pdfjsLib from 'pdfjs-dist';

// Set up worker - use the correct path for pdfjs-dist v4
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    console.log("📄 Starting PDF text extraction...");
    
    // Remove data URL prefix if present
    const base64 = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log("📄 Loading PDF document...");
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: bytes,
      useSystemFonts: true,
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`📄 PDF loaded successfully. Pages: ${pdf.numPages}`);

    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`📄 Extracting text from page ${pageNum}/${pdf.numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      fullText += pageText + '\n\n';
      console.log(`📄 Page ${pageNum} text length: ${pageText.length}`);
    }

    const text = fullText.trim();
    console.log(`✅ Total extracted text length: ${text.length}`);
    
    if (text.length > 0) {
      // Limit to first 4000 chars to avoid token limits
      const truncated = text.substring(0, 4000);
      const finalText = truncated + (text.length > 4000 ? "\n\n[...text truncated for length...]" : "");
      
      console.log(`✅ PDF extraction complete. Final length: ${finalText.length}`);
      return finalText;
    }
    
    const errorMsg = `[PDF Document - ${pdf.numPages} pages, no text could be extracted. This may be an image-based PDF.]`;
    console.warn("⚠️", errorMsg);
    return errorMsg;
  } catch (error) {
    console.error("❌ PDF extraction error:", error);
    return "[Unable to read PDF content. The file may be corrupted or in an unsupported format.]";
  }
}