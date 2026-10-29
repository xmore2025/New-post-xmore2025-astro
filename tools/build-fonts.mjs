#!/usr/bin/env node
/**
 * 字体子集化：把 Inter / Noto Sans SC / JetBrains Mono 裁到站点真正用到的字。
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

/* 中文主字体：霞鹜文楷 Screen（楷体，与 mundi-xu.github.io 同一套字形）。
   上游只发布静态字重的 TTF，没有可变轴，因此不做 variationAxes 裁剪。 */
const LXGW_URL =
  'https://github.com/lxgw/LxgwWenKai-Screen/releases/download/v1.520/LXGWWenKaiScreen.ttf';
const LXGW_CACHE = path.join(CACHE_DIR, 'LXGWWenKaiScreen.ttf');
const MONO_SRC = path.join(
  root,
  'node_modules',
  '@fontsource-variable',
  'jetbrains-mono',
  'files',
  'jetbrains-mono-latin-wght-normal.woff2'
);
const INTER_SRC = path.join(
  root,
  'node_modules',
  '@fontsource-variable',
  'inter',
  'files',
  'inter-latin-ext-wght-normal.woff2'
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

async function download(url, dest, size = '约 17 MB') {
  console.log(`下载源字体 → ${path.relative(root, dest)}（${size}，只需一次）`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

/**
 * 生成一个字重子集，返回文件名、字节数与 css 规则。
 * 文件名带内容哈希：字体变化 → URL 变化 → 可安全长缓存。
 *
 * variable=false 用于只有静态字重的字体（如霞鹜文楷）：不传 variationAxes，
 * 否则 subset-font 会因为找不到 fvar 表而报错。
 */
async function buildFace({
  family,
  source,
  chars,
  weights,
  fileName,
  style = 'normal',
  variable = true,
  downloadUrl,
  downloadSize,
}) {
  if (!fs.existsSync(source)) {
    if (downloadUrl) await download(downloadUrl, source, downloadSize);
    else throw new Error(`缺少字体源文件：${path.relative(root, source)}`);
  }

  // 码点排序后再喂给子集器：保证同样的字表永远产出同样的字节与哈希
  const text = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
  const buffer = await subsetFont(fs.readFileSync(source), text, {
    targetFormat: 'woff2',
    ...(variable ? { variationAxes: { wght: { min: weights[0], max: weights[1] } } } : {}),
    // 中文正文用不到 OpenType 排版特性（连字 / 竖排 / 本地化替换），
    // 去掉后同样字数体积减少约 17%，笔画与字距完全不变。
    keepFeatures: [],
    noHinting: true,
  });

  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
  const hashed = `${path.basename(fileName, '.woff2')}.${hash}.woff2`;
  const weightCss = weights[0] === weights[1] ? `${weights[0]}` : `${weights[0]} ${weights[1]}`;

  return {
    family,
    style,
    weights,
    hashed,
    bytes: buffer.length,
    buffer,
    css:
      `@font-face{font-family:"${family}";font-style:${style};` +
      `font-weight:${weightCss};font-display:swap;` +
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
      family: 'Inter Variable',
      source: INTER_SRC,
      chars: new Set([...chars].filter((ch) => ch.codePointAt(0) <= 0x024f)),
      weights: [400, 650],
      fileName: 'inter-latin-subset.woff2',
    })
  );
  faces.push(
    await buildFace({
      family: 'LXGW WenKai Screen',
      source: LXGW_CACHE,
      chars,
      // 上游只有静态 Regular：600 字重由浏览器合成，和参考站表现一致
      weights: [400, 400],
      fileName: 'lxgw-wenkai-screen-subset.woff2',
      variable: false,
      downloadUrl: LXGW_URL,
      downloadSize: '约 9 MB',
    })
  );
  faces.push(
    await buildFace({
      family: 'Noto Sans SC Variable',
      source: NOTO_CACHE,
      chars,
      // 站点用到的字重区间：正文 400、强调 550–620，收窄轴比 300–700 小一圈
      weights: [400, 650],
      fileName: 'noto-sans-sc-subset.woff2',
      downloadUrl: NOTO_URL,
    })
  );
  faces.push(
    await buildFace({
      family: 'JetBrains Mono Variable',
      source: MONO_SRC,
      chars,
      weights: [400, 650],
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
