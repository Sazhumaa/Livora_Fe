/**
 * Lightweight QR Code SVG Generator & Native Camera Scanner Utility
 * Uses qrcode-generator (~19KB) + native browser BarcodeDetector API.
 */
import qrcode from 'qrcode-generator';

/**
 * Generate crisp scannable SVG markup for a ticket QR payload (e.g. "TKT-XXX|SECRET")
 */
export function generateQrSvg(payload: string, cellSize = 6, margin = 2): string {
  const safePayload = (payload || '').trim() || 'INVALID-QR';
  const qr = qrcode(0, 'M');
  qr.addData(safePayload);
  qr.make();
  return qr.createSvgTag({ cellSize, margin, scalable: true });
}

/**
 * Check whether browser supports native zero-bloat BarcodeDetector for QR codes
 */
export async function isNativeQrDetectorSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return false;
  try {
    const Detector = (window as any).BarcodeDetector;
    if (typeof Detector.getSupportedFormats === 'function') {
      const formats: string[] = await Detector.getSupportedFormats();
      return formats.includes('qr_code');
    }
    return true;
  } catch {
    return false;
  }
}
