import fs from 'fs';
import path from 'path';

// Helper to create 24-bit uncompressed Windows BMP
function createBmp(width, height, drawFn) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0); // Signature
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt16LE(0, 6); // Reserved
  buf.writeUInt16LE(0, 8); // Reserved
  buf.writeUInt32LE(54, 10); // Offset to pixel data

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14); // Header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // Positive = bottom-up
  buf.writeUInt16LE(1, 26); // Planes
  buf.writeUInt16LE(24, 28); // Bits per pixel (24-bit RGB)
  buf.writeUInt32LE(0, 30); // Compression (BI_RGB = 0)
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // ~72 DPI
  buf.writeInt32LE(2835, 42); // ~72 DPI
  buf.writeUInt32LE(0, 46); // Colors used
  buf.writeUInt32LE(0, 50); // Important colors

  // Create pixel canvas (x, y) where y=0 is top
  const pixels = new Uint8ClampedArray(width * height * 4); // RGBA
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 0;     // R
    pixels[i + 1] = 0; // G
    pixels[i + 2] = 0; // B
    pixels[i + 3] = 255; // A
  }

  const ctx = {
    width,
    height,
    setPixel: (x, y, r, g, b, a = 1) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = (y * width + x) * 4;
      if (a >= 1) {
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      } else if (a > 0) {
        const bgR = pixels[idx];
        const bgG = pixels[idx + 1];
        const bgB = pixels[idx + 2];
        pixels[idx] = Math.round(r * a + bgR * (1 - a));
        pixels[idx + 1] = Math.round(g * a + bgG * (1 - a));
        pixels[idx + 2] = Math.round(b * a + bgB * (1 - a));
        pixels[idx + 3] = 255;
      }
    },
    fillRect: (rx, ry, rw, rh, r, g, b, a = 1) => {
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          ctx.setPixel(x, y, r, g, b, a);
        }
      }
    },
    fillRoundedRect: (rx, ry, rw, rh, radius, r, g, b, a = 1) => {
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          let inside = true;
          if (x < rx + radius && y < ry + radius) {
            const dx = x - (rx + radius);
            const dy = y - (ry + radius);
            if (dx * dx + dy * dy > radius * radius) inside = false;
          } else if (x >= rx + rw - radius && y < ry + radius) {
            const dx = x - (rx + rw - radius - 1);
            const dy = y - (ry + radius);
            if (dx * dx + dy * dy > radius * radius) inside = false;
          } else if (x < rx + radius && y >= ry + rh - radius) {
            const dx = x - (rx + radius);
            const dy = y - (ry + rh - radius - 1);
            if (dx * dx + dy * dy > radius * radius) inside = false;
          } else if (x >= rx + rw - radius && y >= ry + rh - radius) {
            const dx = x - (rx + rw - radius - 1);
            const dy = y - (ry + rh - radius - 1);
            if (dx * dx + dy * dy > radius * radius) inside = false;
          }
          if (inside) ctx.setPixel(x, y, r, g, b, a);
        }
      }
    },
    drawLogoMark: (centerX, centerY, size, primaryColor, secondaryColor) => {
      // Snapcmd Logo:
      // SVG viewBox="0 0 32 32"
      // Chevron 1: M6 10 L14 16 L6 22 L8.4 16 Z (opacity 0.35)
      // Chevron 2: M10 6 L22 16 L10 26 L14 16 Z (opacity 1.0)
      // Cursor bar: M8 27 W16 H2.5 (opacity 1.0)
      const scale = size / 32;
      const offsetX = centerX - size / 2;
      const offsetY = centerY - size / 2;

      // Render triangles and rect by point-in-polygon
      function inTri(px, py, x1, y1, x2, y2, x3, y3) {
        const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
        const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
        const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
      }

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const sx = x / scale;
          const sy = y / scale;

          // Main chevron: 2 triangles (10,6)-(22,16)-(14,16) and (10,26)-(22,16)-(14,16)
          if (inTri(sx, sy, 10, 6, 22, 16, 14, 16) || inTri(sx, sy, 10, 26, 22, 16, 14, 16)) {
            ctx.setPixel(offsetX + x, offsetY + y, primaryColor[0], primaryColor[1], primaryColor[2], 1);
          }
          // Ghost chevron: 2 triangles (6,10)-(14,16)-(8.4,16) and (6,22)-(14,16)-(8.4,16)
          else if (inTri(sx, sy, 6, 10, 14, 16, 8.4, 16) || inTri(sx, sy, 6, 22, 14, 16, 8.4, 16)) {
            ctx.setPixel(offsetX + x, offsetY + y, secondaryColor[0], secondaryColor[1], secondaryColor[2], 0.6);
          }
          // Cursor bar: rect x=8..24, y=27..29.5
          else if (sx >= 8 && sx <= 24 && sy >= 26.5 && sy <= 29.5) {
            ctx.setPixel(offsetX + x, offsetY + y, primaryColor[0], primaryColor[1], primaryColor[2], 1);
          }
        }
      }
    }
  };

  // Run draw callback
  drawFn(ctx);

  // Write pixel data bottom-to-top, BGR format
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      buf[offset++] = pixels[idx + 2]; // B
      buf[offset++] = pixels[idx + 1]; // G
      buf[offset++] = pixels[idx];     // R
    }
    // Padding
    for (let p = 0; p < rowSize - width * 3; p++) {
      buf[offset++] = 0;
    }
  }

  return buf;
}

// 1. Generate Sidebar BMP (164 x 314)
const sidebarBuf = createBmp(164, 314, (ctx) => {
  // Deep sleek dark gradient
  for (let y = 0; y < ctx.height; y++) {
    const t = y / ctx.height;
    // Top #0f172a (15, 23, 42) -> Bottom #070a12 (7, 10, 18)
    const r = Math.round(15 * (1 - t) + 7 * t);
    const g = Math.round(23 * (1 - t) + 10 * t);
    const b = Math.round(42 * (1 - t) + 18 * t);
    for (let x = 0; x < ctx.width; x++) {
      ctx.setPixel(x, y, r, g, b);
    }
  }

  // Subtle ambient emerald radial glow around badge (center x: 82, y: 100)
  for (let y = 40; y < 160; y++) {
    for (let x = 20; x < 144; x++) {
      const dx = x - 82;
      const dy = y - 100;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 55) {
        const factor = (1 - dist / 55) * 0.22;
        ctx.setPixel(x, y, 16, 185, 129, factor); // #10b981
      }
    }
  }

  // Right vertical subtle border
  for (let y = 0; y < ctx.height; y++) {
    ctx.setPixel(ctx.width - 1, y, 30, 41, 59); // #1e293b
  }
  // Right edge glowing emerald segment
  for (let y = 60; y < 160; y++) {
    const t = 1 - Math.abs(y - 110) / 50;
    ctx.setPixel(ctx.width - 1, y, 16, 185, 129, t * 0.7);
  }

  // Center Badge (64x64 at x: 50, y: 68)
  ctx.fillRoundedRect(48, 66, 68, 68, 16, 16, 185, 129, 0.4); // outer soft glow
  ctx.fillRoundedRect(50, 68, 64, 64, 14, 16, 185, 129); // border
  ctx.fillRoundedRect(52, 70, 60, 60, 12, 11, 15, 25); // inner dark bg

  // Logo inside badge
  ctx.drawLogoMark(82, 100, 36, [52, 211, 153], [16, 185, 129]);

  // Modern horizontal accent bar
  ctx.fillRoundedRect(66, 150, 32, 3, 1.5, 16, 185, 129, 0.9);

  // Modern tech dot grid pattern near bottom
  for (let gy = 240; gy < 290; gy += 10) {
    for (let gx = 32; gx <= 132; gx += 10) {
      ctx.setPixel(gx, gy, 30, 41, 59, 0.5);
    }
  }
});

// 2. Generate Header BMP (150 x 57)
const headerBuf = createBmp(150, 57, (ctx) => {
  // Pure white background to blend seamlessly with NSIS MUI2 header
  ctx.fillRect(0, 0, ctx.width, ctx.height, 255, 255, 255);

  // Right-aligned brand badge (center x: 118, y: 28)
  ctx.fillRoundedRect(98, 8, 40, 40, 10, 16, 185, 129); // emerald border
  ctx.fillRoundedRect(100, 10, 36, 36, 8, 15, 23, 42); // dark slate fill

  // Snapcmd logo inside badge
  ctx.drawLogoMark(118, 28, 24, [52, 211, 153], [16, 185, 129]);
});

fs.writeFileSync('src-tauri/icons/installer-sidebar.bmp', sidebarBuf);
fs.writeFileSync('src-tauri/icons/installer-header.bmp', headerBuf);
console.log('Successfully generated installer-sidebar.bmp and installer-header.bmp');
