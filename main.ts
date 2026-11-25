// main.ts — placeholder edition for make.fun news-image-20261125.
//
// Draws a 1024x1024 PNG summing up 25 November 2026 world news.
// THIS SKELETON carries clearly-marked PLACEHOLDER story text only.
// The refresh run rewrites every story line with verified 25 November
// 2026 news before submission. Node stdlib only, no network,
// deterministic: two runs write identical bytes.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- pixels

const buf = Buffer.alloc(W * H * 3);

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}

function hline(x, y, w, c) {
  rect(x, y, w, 3, c);
}

// ------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows of 5 cells, "#" = ink. Authored fresh for this entry.

const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
};

function textWidth(text, scale) {
  return text.length * 6 * scale - scale;
}

function drawText(text, x, y, scale, color, center) {
  const upper = text.toUpperCase();
  let cx = center ? x - Math.floor(textWidth(upper, scale) / 2) : x;
  for (const ch of upper) {
    const glyph = GLYPHS[ch] || GLYPHS[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          rect(cx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cx += 6 * scale;
  }
}

// ------------------------------------------------------------ PNG encode

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ------------------------------------------------------------------ art

const INK = [240, 238, 230];
const GOLD = [198, 158, 74];
const MUTED = [148, 163, 184];
const ROW_BG = [34, 49, 79];
const THUMBS = [
  [191, 90, 60],
  [60, 140, 160],
  [150, 120, 50],
  [90, 140, 90],
  [140, 90, 150],
];

// Vertical gradient background.
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const r = Math.round(14 + (27 - 14) * t);
  const g = Math.round(22 + (42 - 22) * t);
  const b = Math.round(38 + (68 - 38) * t);
  rect(0, y, W, 1, [r, g, b]);
}

// Masthead.
hline(56, 44, W - 112, GOLD);
drawText("25 NOVEMBER 2026", W / 2, 72, 8, INK, true);
drawText("ONE DAY IN ONE IMAGE", W / 2, 168, 3, GOLD, true);
hline(56, 216, W - 112, GOLD);
drawText("PLACEHOLDER EDITION", W / 2, 236, 2, MUTED, true);

// Five placeholder story rows.
const ROW_Y = 284;
const ROW_H = 118;
const ROW_GAP = 14;
const KICKERS = ["STORY 1", "STORY 2", "STORY 3", "STORY 4", "STORY 5"];
const HEADLINES = [
  "PLACEHOLDER HEADLINE ONE",
  "PLACEHOLDER HEADLINE TWO",
  "PLACEHOLDER HEADLINE THREE",
  "PLACEHOLDER HEADLINE FOUR",
  "PLACEHOLDER HEADLINE FIVE",
];

for (let i = 0; i < 5; i++) {
  const y = ROW_Y + i * (ROW_H + ROW_GAP);
  rect(56, y, W - 112, ROW_H, ROW_BG);
  // Thumbnail block with a simple shape per row.
  const tx = 72;
  const ty = y + 12;
  const tw = 132;
  const th = ROW_H - 24;
  rect(tx, ty, tw, th, THUMBS[i]);
  const fg = [245, 245, 240];
  if (i === 0) {
    // Circle.
    for (let j = 0; j < th; j++) {
      for (let k = 0; k < tw; k++) {
        const dx = k - tw / 2;
        const dy = j - th / 2;
        if (dx * dx + dy * dy <= 28 * 28) px(tx + k, ty + j, fg);
      }
    }
  } else if (i === 1) {
    // Triangle.
    for (let j = 0; j < th; j++) {
      const half = Math.floor((j / th) * (tw / 2));
      for (let k = tw / 2 - half; k <= tw / 2 + half; k++) px(tx + k, ty + j, fg);
    }
  } else if (i === 2) {
    // Horizontal bars.
    for (let j = 8; j < th - 8; j += 16) rect(tx + 12, ty + j, tw - 24, 7, fg);
  } else if (i === 3) {
    // Diamond.
    for (let j = 0; j < th; j++) {
      for (let k = 0; k < tw; k++) {
        const d = Math.abs(k - tw / 2) + Math.abs(j - th / 2) * 1.4;
        if (d <= 42) px(tx + k, ty + j, fg);
      }
    }
  } else {
    // Rings.
    for (let j = 0; j < th; j++) {
      for (let k = 0; k < tw; k++) {
        const dx = k - tw / 2;
        const dy = j - th / 2;
        const d = Math.sqrt(dx * dx + dy * dy);
        if ((d > 12 && d < 18) || (d > 30 && d < 36)) px(tx + k, ty + j, fg);
      }
    }
  }
  drawText(KICKERS[i], 232, y + 18, 2, GOLD, false);
  drawText(HEADLINES[i], 232, y + 46, 3, INK, false);
  drawText("VERIFIED NEWS GOES HERE", 232, y + 84, 2, MUTED, false);
}

// Footer.
hline(56, 952, W - 112, GOLD);
drawText("TEXT TO BE REFRESHED WITH COMPLETE 25 NOVEMBER 2026 NEWS", W / 2, 968, 2, MUTED, true);

// ----------------------------------------------------------------- main

const out = process.env.ENTRY_OUTPUT || "/output/entry.png";
mkdirSync(dirname(out), { recursive: true });
const png = encodePNG();
writeFileSync(out, png);
console.log("wrote " + out + " " + png.length + " bytes");
