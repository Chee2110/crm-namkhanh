/**
 * In một vùng nội dung (tờ A4) trong iframe tách biệt khỏi giao diện ứng dụng.
 * - Không bị cắt bởi khung modal cuộn (max-height / overflow) như khi gọi window.print() trực tiếp
 * - Không bị ảnh hưởng bởi zoom 0.9 của <html> hay bố cục responsive của trang
 * - Tiêu đề tài liệu được dùng làm tên file gợi ý khi "Lưu thành PDF"
 */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const waitWithTimeout = (promise: Promise<unknown>, ms: number) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

export async function printA4(elementId: string, documentTitle?: string): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win?.document;
  if (!win || !doc) {
    iframe.remove();
    window.print();
    return;
  }

  // Sao chép toàn bộ stylesheet hiện có (Tailwind + CSS mẫu in A4)
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  const title = escapeHtml(documentTitle || document.title || 'Ban_in_A4');
  doc.open();
  doc.write(
    `<!DOCTYPE html><html lang="vi" class="a4-print-doc"><head><meta charset="utf-8" />` +
      `<base href="${window.location.origin}/" /><title>${title}</title>${styles}` +
      `<style>
        @page { size: A4 portrait; margin: 6mm 8mm; }
        body, body * { font-family: 'Times New Roman', Times, 'Liberation Serif', serif !important; color: #000000 !important; }
        table { border-collapse: collapse !important; }
      </style></head>` +
      `<body class="a4-print-body">${source.outerHTML}</body></html>`
  );
  doc.close();

  // Chờ CSS, hình ảnh (logo, mã QR) và font tải xong trước khi in (tối đa ~4 giây)
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  const images = Array.from(doc.images);
  await waitWithTimeout(
    Promise.all([
      ...links.map((l) =>
        l.sheet ? Promise.resolve() : new Promise((resolve) => { l.onload = resolve; l.onerror = resolve; })
      ),
      ...images.map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
      )
    ]),
    4000
  );
  if ((doc as any).fonts?.ready) {
    await waitWithTimeout((doc as any).fonts.ready, 1500);
  }

  // Tự động co giãn vừa khít 1 trang A4 (tương đương Fit to 1 page wide by 1 page tall của Excel)
  const sheetEl = doc.body.firstElementChild as HTMLElement | null;
  if (sheetEl) {
    sheetEl.style.padding = '0';
    sheetEl.style.margin = '0';
    sheetEl.style.width = '100%';
    const maxSinglePageHeightPx = 1030; // ~285mm vùng in khả dụng của khổ A4 đứng
    const currentHeight = sheetEl.scrollHeight || doc.body.scrollHeight;
    if (currentHeight > maxSinglePageHeightPx && currentHeight <= 1700) {
      const fitScale = Math.max(0.62, Math.floor((maxSinglePageHeightPx / currentHeight) * 1000) / 1000);
      (sheetEl.style as any).zoom = String(fitScale);
    }
  }

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  // Dự phòng cho trình duyệt không phát sự kiện afterprint
  setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
}
