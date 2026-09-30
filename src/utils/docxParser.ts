import mammoth from 'mammoth';
import { UpcomingScheduleItem } from '../types';

export interface DocxParseResult {
  html: string;
  rawText: string;
  extractedSchedule: UpcomingScheduleItem[];
  messages: string[];
}

/**
 * Parses a Word document (.docx) ArrayBuffer into HTML, raw text, and structured schedule items.
 */
export async function parseDocxFile(arrayBuffer: ArrayBuffer): Promise<DocxParseResult> {
  try {
    const conversionResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = conversionResult.value || '';
    const messages = (conversionResult.messages || []).map((m: { message?: string }) => m.message || String(m));

    // Also get raw text
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = textResult.value || '';

    // Extract table rows if any tables exist in the Word document
    const extractedSchedule: UpcomingScheduleItem[] = [];

    if (typeof window !== 'undefined' && html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table');

        tables.forEach((table, tableIdx) => {
          const trElements = table.querySelectorAll('tr');
          trElements.forEach((tr, trIdx) => {
            const cells = Array.from(tr.querySelectorAll('td, th')).map((cell) => cell.textContent?.trim() || '');
            if (cells.length === 0) return;

            // Skip header row if it contains words like 'time', 'date', 'ເວລາ', 'ວັນທີ'
            const isHeader =
              trIdx === 0 &&
              cells.some(
                (c) =>
                  /^(time|date|ລຳດັບ|ເວລາ|ກິດຈະກຳ|ລາຍການ|ກຳນົດການ|activity|schedule|speaker|location)$/i.test(c) ||
                  /^(no|#|item)$/i.test(c)
              );

            if (isHeader) return;

            // Extract based on column positions
            let time = '';
            let activity = '';
            let speaker = '';
            let location = '';
            let note = '';

            if (cells.length === 1) {
              activity = cells[0];
            } else if (cells.length === 2) {
              time = cells[0];
              activity = cells[1];
            } else if (cells.length === 3) {
              time = cells[0];
              activity = cells[1];
              speaker = cells[2];
            } else if (cells.length >= 4) {
              time = cells[0];
              activity = cells[1];
              speaker = cells[2];
              location = cells[3];
              if (cells.length > 4) {
                note = cells.slice(4).join(' | ');
              }
            }

            if (time || activity || speaker || location) {
              extractedSchedule.push({
                id: `docx-${tableIdx}-${trIdx}-${Date.now()}`,
                time: time || '08:00',
                activity: activity || 'ກິດຈະກຳ',
                speaker: speaker || undefined,
                location: location || undefined,
                note: note || undefined,
              });
            }
          });
        });

        // If no tables were found, parse line by line for bullet points or time patterns
        if (extractedSchedule.length === 0 && rawText) {
          const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
          lines.forEach((line, idx) => {
            // Check for time pattern e.g. "08:00 - 09:00: ກິດຈະກຳ..." or "1. 09:00..."
            const timeMatch = line.match(/^(\d{1,2}[:.]\d{2}(?:\s*-\s*\d{1,2}[:.]\d{2})?)\s*[:|-]?\s*(.+)$/i);
            if (timeMatch) {
              extractedSchedule.push({
                id: `line-${idx}-${Date.now()}`,
                time: timeMatch[1].trim(),
                activity: timeMatch[2].trim(),
              });
            }
          });
        }
      } catch (domErr) {
        console.warn('DOM parsing of docx html failed:', domErr);
      }
    }

    return {
      html,
      rawText,
      extractedSchedule,
      messages,
    };
  } catch (error) {
    console.error('Failed to parse docx with mammoth:', error);
    throw error;
  }
}
