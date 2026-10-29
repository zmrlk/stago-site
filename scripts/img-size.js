// Wymiary rastrowych obrazów (PNG, JPEG, WebP) bez zależności.
// Używane przez build (uzupełnienie width/height) i generator województw.
const fs = require('fs');

function wymiary(plik) {
  let b;
  try {
    b = fs.readFileSync(plik);
  } catch (e) {
    return null;
  }
  if (b.length > 24 && b.toString('ascii', 1, 4) === 'PNG') {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 8 < b.length) {
      if (b[o] !== 0xff) break;
      const marker = b[o + 1];
      if (marker === 0xd8 || marker === 0xd9) { o += 2; continue; }
      const len = b.readUInt16BE(o + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) };
      }
      o += 2 + len;
    }
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = b.toString('ascii', 12, 16);
    if (fmt === 'VP8X' && b.length >= 30) {
      return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    }
    if (fmt === 'VP8 ' && b.length >= 30) {
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === 'VP8L' && b.length >= 25) {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

module.exports = { wymiary };
