import { Canvas, Image, createCanvas } from 'canvas';
import QRCode from 'qrcode';

export interface StyledQRCodeOptions {
  qrData: string;
  caption?: string;
  backgroundColor?: string;
  qrDotColor?: string;
  infos?: Record<string, string | number>;
}

/**
 * Wrap text to fit within a specified width
 */
function wrapText(
  ctx: any,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generate a styled QR code with blue background, white dots, and caption
 */
export async function generateStyledQRCode(
  options: StyledQRCodeOptions,
): Promise<Buffer> {
  const {
    qrData,
    caption,
    backgroundColor = '#0066cc', // Blue
    qrDotColor = '#ffffff', // White
    infos = {},
  } = options;

  // Generate base QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 1,
    width: 300,
  });

  // Load QR code image
  const qrImage = new Image();
  qrImage.src = qrBuffer;

  // Create temporary canvas to measure text
  const tempCanvas = createCanvas(800, 1);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '20px Arial';

  // Calculate caption height based on wrapped lines
  let captionHeight = 0;
  let wrappedLines: string[] = [];
  const maxCaptionWidth = qrImage.naturalWidth + 40;

  if (caption) {
    wrappedLines = wrapText(tempCtx, caption, maxCaptionWidth - 20);
    captionHeight = (wrappedLines.length * 28) + 40; // 28px per line + padding
  }

  // Create canvas with padding
  const padding = 40;
  const infoHeight = Object.keys(infos).length > 0 ? (Object.keys(infos).length * 40 + 40) : 0;

  const canvasWidth = qrImage.naturalWidth + padding * 2;
  const canvasHeight = qrImage.naturalHeight + padding * 2 + captionHeight + infoHeight;

  // Create canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Fill background with blue
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw QR code centered
  ctx.drawImage(qrImage, padding, padding);

  // Draw caption if provided (wrapped)
  if (caption && wrappedLines.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    
    let captionY = qrImage.naturalHeight + padding * 2 + 20;
    for (const line of wrappedLines) {
      ctx.fillText(line, canvasWidth / 2, captionY);
      captionY += 28;
    }
  }

  // Draw info details below caption
  if (Object.keys(infos).length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    let yOffset = qrImage.naturalHeight + padding * 2 + captionHeight + padding;

    for (const [key, value] of Object.entries(infos)) {
      const text = `${key}: ${value}`;
      ctx.fillText(text, padding + 20, yOffset);
      yOffset += 40;
    }
  }

  // Convert to buffer
  return canvas.toBuffer('image/png');
}
