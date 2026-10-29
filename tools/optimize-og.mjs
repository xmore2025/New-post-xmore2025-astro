#!/usr/bin/env node
/**
 * og-card PNG 无损级压缩：调色板量化 + zopfli 级压缩。
 *
 * 为什么保留 PNG 而不是转 WebP/AVIF：og:image 的消费方是社交平台的
 * 爬虫（Facebook / X / LinkedIn），对 WebP 的支持参差不齐，转格式有
 * 预览图变白的风险。PNG 调色板量化对"纯色 + 文字"的卡片几乎无损。
 *
 * 质量守门：脚本会把量化前后的像素逐通道对比，平均差异超过阈值就
 * 自动回退为纯 lossless 重压缩（只省体积，不动像素）。
 *
 * 用法：node tools/optimize-og.mjs [--check]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const SRC = path.join(root, 'public', 'og-card-v2.png');

/** 逐像素对比：返回 { mean, max }（0-255 尺度的每通道差） */
async function diffPixels(before, after) {
  const [a, b] = await Promise.all([
    sharp(before).raw().toBuffer({ resolveWithObject: true }),
    sharp(after).raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    throw new Error('尺寸不一致');
  }
  const n = Math.min(a.data.length, b.data.length);
  let sum = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a.data[i] - b.data[i]);
    sum += d;
    if (d > max) max = d;
  }
  return { mean: sum / n, max };
}

async function main() {
  const original = fs.readFileSync(SRC);
  const meta = await sharp(SRC).metadata();
  console.log(`源图：${meta.width}×${meta.height} · ${original.length} bytes`);

  // 候选 1：调色板量化（flat 设计的卡片通常可省 50-70%）
  const palette = await sharp(SRC)
    .png({ palette: true, quality: 95, compressionLevel: 9, effort: 10 })
    .toBuffer();

  // 候选 2：无损重压缩（只重新编码，不改像素）
  const lossless = await sharp(SRC).png({ compressionLevel: 9, effort: 10 }).toBuffer();

  const pd = await diffPixels(SRC, palette).catch(() => ({ mean: Infinity, max: Infinity }));
  const paletteOk = pd.mean < 1 && pd.max <= 8; // 平均差 <1/255 且无突变色带

  // 小于 1KB / 1% 的差异视为编码噪声，避免 --check 误报
  const meaningful = (buf) => original.length - buf.length > Math.max(1024, original.length * 0.01);
  const candidates = [
    {
      name: 'palette',
      buf: palette,
      ok: paletteOk,
      note: `mean=${pd.mean.toFixed(3)} max=${pd.max}`,
    },
    { name: 'lossless', buf: lossless, ok: true, note: '像素不变' },
  ].filter((c) => c.ok && meaningful(c.buf));

  if (!candidates.length) {
    console.log('✓ 已是最优，无需优化');
    return;
  }
  candidates.sort((a, b) => a.buf.length - b.buf.length);
  const best = candidates[0];

  if (checkOnly) {
    console.log(
      `可再省 ${original.length - best.buf.length} bytes（${best.name}，${best.note}）—— 运行 npm run og 应用`
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(SRC, best.buf);
  const saved = original.length - best.buf.length;
  console.log(
    `✓ 采用 ${best.name}（${best.note}）：${original.length} → ${best.buf.length} bytes，省 ${((100 * saved) / original.length).toFixed(1)}%`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
