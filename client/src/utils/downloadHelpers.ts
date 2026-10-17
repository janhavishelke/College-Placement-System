/**
 * UNERA v3 — Universal Download Utility (PDF, PNG, MP4, TXT)
 */

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPdfFile(title: string, htmlContent: string, filename: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} — UNERA Study Export</title>
        <style>
          @page { margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e1e24;
            line-height: 1.5;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #FF5E4D;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand { font-size: 20px; font-weight: 800; color: #1e1e24; }
          .tagline { font-size: 11px; color: #6b625e; }
          .title { font-size: 24px; font-weight: 700; color: #FF5E4D; margin: 16px 0 8px; }
          .card {
            background: #faf7f2;
            border: 1px solid #e5d7c5;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .badge {
            display: inline-block;
            background: #ffe3df;
            color: #b91c1c;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            margin-bottom: 6px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e5d7c5;
            padding-top: 12px;
            font-size: 10px;
            color: #8c827a;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">UNERA</div>
            <div class="tagline">Learn from your own notes. Grounded study materials.</div>
          </div>
          <div style="font-size: 11px; color: #8c827a;">
            Exported on ${new Date().toLocaleDateString()}
          </div>
        </div>
        <div class="title">${title}</div>
        <div>${htmlContent}</div>
        <div class="footer">
          <span>Unera Adaptive Learning Engine — Zero Hallucination Guarantee</span>
          <span>Verified Page References Included</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function downloadPngFromDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadVideoBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mp4') || filename.endsWith('.webm') ? filename : `${filename}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
