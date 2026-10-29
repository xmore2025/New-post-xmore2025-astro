#!/usr/bin/env node
/**
 * 生成 public/apple-touch-icon.png（180×180）。
 *
 * 为什么需要：iOS Safari 不支持 SVG 触屏图标，<link rel="apple-touch-icon">
 * 指向 SVG 时会被忽略，用户添加到主屏幕只会得到截图方块。这里用纯 Node
 * （zlib + 手写 PNG 编码）把 favicon 的设计光栅化：深底 + 白色 X + 蓝点。
 *
 * 用法：node tools/gen-touch-icon.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SIZE = 180;
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'apple-touch-icon.png'
);

/* ---------- 像素绘制（与 favicon.svg 同一套设计语言） ---------- */
const BG = [23, 23, 27]; // #17171b
const FG = [251, 250, 248]; // #fbfaf8
const DOT = [122, 169, 240]; // #7aa9f0

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** 点到线段的距离 */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp01(t);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** 一像素宽的线段覆盖度（抗锯齿） */
function lineCoverage(px, py, x1, y1, x2, y2, halfWidth) {
  const d = distToSegment(px, py, x1, y1, x2, y2);
  return clamp01(halfWidth + 0.5 - d);
}

const margin = 42;
const strokeHalf = 11;
const a = [margin, margin];
const b = [SIZE - margin, SIZE - margin];
const c = [SIZE - margin, margin];
const d = [margin, SIZE - margin];
const dotR = 11;

const pixels = Buffer.alloc(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // 采样点取像素中心
    const px = x + 0.5;
    const py = y + 0.5;

    // 背景
    let r = BG[0];
    let g = BG[1];
    let bl = BG[2];

    // 两条对角线（第二条透明度略低，呼应 favicon 的 opacity 0.8）
    const cov1 = lineCoverage(px, py, a[0], a[1], b[0], b[1], strokeHalf);
    const cov2 = lineCoverage(px, py, c[0], c[1], d[0], d[1], strokeHalf) * 0.82;
    const covX = Math.max(cov1, cov2);
    r += (FG[0] - r) * covX;
    g += (FG[1] - g) * covX;
    bl += (FG[2] - bl) * covX;

    // 中心蓝点（叠在最上层）
    const dd = Math.hypot(px - SIZE / 2, py - SIZE / 2);
    const covDot = clamp01(dotR + 0.5 - dd);
    r += (DOT[0] - r) * covDot;
    g += (DOT[1] - g) * covDot;
    bl += (DOT[2] - bl) * covDot;

    const i = (y * SIZE + x) * 4;
    pixels[i] = Math.round(r);
    pixels[i + 1] = Math.round(g);
    pixels[i + 2] = Math.round(bl);
    pixels[i + 3] = 255;
  }
}

/* ---------- PNG 编码 ---------- */
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

// 每行前加 filter byte 0（None）
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  pixels.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync(OUT, png);
console.log(`apple-touch-icon.png · ${SIZE}×${SIZE} · ${png.length} bytes`);
