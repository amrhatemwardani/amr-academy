/**
 * Bulletproof certificate printing helper
 * Uses an isolated, dedicated hidden iframe to ensure 100% accurate A4 landscape
 * printing with exact colors, zero margins, no modal backdrop artifacts, and no page clipping.
 */
export function printCertificateElement(element: HTMLElement | null) {
  if (!element) {
    window.print()
    return
  }

  try {
    // 1. Remove any previous print iframes
    const existingIframe = document.getElementById('certificate-print-iframe')
    if (existingIframe) {
      existingIframe.remove()
    }

    // 2. Create hidden print iframe
    const iframe = document.createElement('iframe')
    iframe.id = 'certificate-print-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    // 3. Extract all current document styles and links
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n')

    // 4. Construct complete self-contained HTML document
    const contentHtml = element.outerHTML

    const fullHtml = `
      <!DOCTYPE html>
      <html dir="${element.getAttribute('dir') || 'rtl'}">
        <head>
          <meta charset="utf-8" />
          <title>Official Certificate — Eng. Amr Hatem Academy</title>
          ${styleTags}
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            .certificate-sheet {
              width: 297mm !important;
              height: 210mm !important;
              max-width: 297mm !important;
              max-height: 210mm !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 297mm; height: 210mm; display: flex; align-items: center; justify-content: center;">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `

    doc.open()
    doc.write(fullHtml)
    doc.close()

    // 5. Clean up after print dialog finishes
    setTimeout(() => {
      try {
        iframe.remove()
      } catch {
        // ignore
      }
    }, 60000)
  } catch (err) {
    console.error('Print iframe error, falling back to window.print():', err)
    window.print()
  }
}
