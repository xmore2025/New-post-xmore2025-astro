#!/usr/bin/env node
/**
 * 字体子集化：把 Noto Sans SC / JetBrains Mono 裁到「站点真正用到的字」。
 *
 * 为什么需要：@fontsource 的中文分片按使用频率切了 100+ 片，一篇文章仍要拉
 * 16 片、约 880 KB。子集化后同样一页只需 1 个 woff2（约 280 KB）。
 *
 * 用法：
 *   node tools/build-fonts.mjs           # 生成 public/fonts/*.woff2 与 font-face.css
 *   node tools/build-fonts.mjs --check   # 只校验：产物是否与当前内容同步（CI 用）
 *
 * 源字体：Noto Sans SC VF 有 17 MB，不进仓库；缺失时自动从 google/fonts 下载到
 * tools/.cache/（已 gitignore）。仓库只提交生成后的子集。
 *
 * 说明：@font-face 不写 unicode-range —— 子集已覆盖全部内容字符；元素里出现
 * 子集外的生僻字时，浏览器会按字体栈自动回退到系统字体，不会显示豆腐块。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const CACHE_DIR = path.join(root, 'tools', '.cache');
const OUT_DIR = path.join(root, 'public', 'fonts');
const CSS_OUT = path.join(root, 'src', 'styles', 'font-face.css');

const NOTO_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf';
const NOTO_CACHE = path.join(CACHE_DIR, 'NotoSansSC-VF.ttf');
const MONO_SRC = path.join(
  root,
  'node_modules',
  '@fontsource-variable',
  'jetbrains-mono',
  'files',
  'jetbrains-mono-latin-wght-normal.woff2'
);

// 只扫描"会被渲染成文字"的文件；CSS 里的中文只出现在注释里，
// 把它算进字表会让改动注释也触发字体重建。
const TEXT_EXT = new Set(['.md', '.astro', '.ts', '.js', '.mjs', '.json']);
const SCAN_DIRS = ['src'];
const SCAN_FILES = ['site.config.json'];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (TEXT_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

/** 站点会用、但不一定出现在源码里的字符（标点、符号） */
const BASELINE =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' +
  'abcdefghijklmnopqrstuvwxyz{|}~' +
  '，。、；：？！“”‘’（）【】《》〈〉「」『』—…·～％＋－×÷＝≤≥→←↑↓↗↙✓✗•';

function collectChars() {
  const files = [
    ...SCAN_DIRS.flatMap((dir) => walk(path.join(root, dir))),
    ...SCAN_FILES.map((file) => path.join(root, file)),
  ];
  const chars = new Set([...BASELINE]);
  for (const file of files) {
    for (const ch of fs.readFileSync(file, 'utf8')) chars.add(ch);
  }
  for (const ch of [...chars]) {
    const cp = ch.codePointAt(0);
    if (cp < 0x20 && ch !== '\n' && ch !== '\t') chars.delete(ch);
  }
  return { chars, files };
}

async function download(url, dest) {
  console.log(`下载源字体 → ${path.relative(root, dest)}（约 17 MB，只需一次）`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

/**
 * 生成一个字重子集，返回文件名、字节数与 css 规则。
 * 文件名带内容哈希：字体变化 → URL 变化 → 可安全长缓存。
 */
async function buildFace({ family, source, chars, weights, fileName, style = 'normal' }) {
  if (!fs.existsSync(source)) {
    if (source === NOTO_CACHE) await download(NOTO_URL, source);
    else throw new Error(`缺少字体源文件：${path.relative(root, source)}`);
  }

  // 码点排序后再喂给子集器：保证同样的字表永远产出同样的字节与哈希
  const text = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
  const buffer = await subsetFont(fs.readFileSync(source), text, {
    targetFormat: 'woff2',
    variationAxes: { wght: { min: weights[0], max: weights[1] } },
  });

  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
  const hashed = `${path.basename(fileName, '.woff2')}.${hash}.woff2`;

  return {
    family,
    style,
    weights,
    hashed,
    bytes: buffer.length,
    buffer,
    css:
      `@font-face{font-family:"${family}";font-style:${style};` +
      `font-weight:${weights[0]} ${weights[1]};font-display:swap;` +
      `src:url("/fonts/${hashed}") format("woff2")}`,
  };
}

async function main() {
  const { chars, files } = collectChars();
  const sorted = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  const charsHash = crypto.createHash('sha1').update(sorted.join('')).digest('hex').slice(0, 8);
  console.log(`扫描 ${files.length} 个文件，收集到 ${chars.size} 个字符（字表 ${charsHash}）`);

  // 校验模式：只比对字表哈希与字体文件是否存在，不需要 17 MB 源字体（CI 用）
  if (checkOnly) {
    const current = fs.existsSync(CSS_OUT) ? fs.readFileSync(CSS_OUT, 'utf8') : '';
    if (!current.includes(`chars:${charsHash}`)) {
      console.error('✗ 字体子集与当前内容不一致，请运行 npm run fonts');
      process.exit(1);
    }
    const refs = [...current.matchAll(/\/fonts\/([^")]+\.woff2)/g)].map((m) => m[1]);
    const missing = refs.filter((name) => !fs.existsSync(path.join(OUT_DIR, name)));
    if (missing.length) {
      console.error(`✗ 缺少字体文件：${missing.join('、')}`);
      process.exit(1);
    }
    console.log('✓ 字体子集覆盖当前内容');
    return;
  }

  const faces = [];
  faces.push(
    await buildFace({
      family: 'Noto Sans SC Variable',
      source: NOTO_CACHE,
      chars,
      weights: [300, 700],
      fileName: 'noto-sans-sc-subset.woff2',
    })
  );
  faces.push(
    await buildFace({
      family: 'JetBrains Mono Variable',
      source: MONO_SRC,
      chars,
      weights: [300, 700],
      fileName: 'jetbrains-mono-subset.woff2',
    })
  );

  for (const face of faces) console.log(`  ${face.family}: ${(face.bytes / 1024).toFixed(0)} KB`);

  const css = [
    `/* 由 tools/build-fonts.mjs 生成，请勿手改 —— 内容更新后运行 \`npm run fonts\` · chars:${charsHash} */`,
    ...faces.map((face) => face.css),
    '',
  ].join('\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const face of faces) fs.writeFileSync(path.join(OUT_DIR, face.hashed), face.buffer);

  // 清理旧版本，避免 public/fonts 越积越多
  const keep = new Set(faces.map((face) => face.hashed));
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (!keep.has(name)) fs.rmSync(path.join(OUT_DIR, name));
  }

  fs.writeFileSync(CSS_OUT, css);
  console.log(`✓ 已生成 ${path.relative(root, CSS_OUT)} 与 ${faces.length} 个子集字体`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
