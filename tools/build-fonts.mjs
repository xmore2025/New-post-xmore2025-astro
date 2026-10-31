#!/usr/bin/env node
/**
 * 字体子集化：把霞鹜文楷 / Inter / Noto Sans SC / 等宽字体裁到站点真正用到的字。
 *
 * 为什么需要：@fontsource 的中文分片按使用频率切了 100+ 片，一篇文章仍要拉
 * 16 片、约 880 KB。子集化后同样一页只需 1 个 woff2（约 280 KB）。
 *
 * 用法：
 *   node tools/build-fonts.mjs           # 生成 public/fonts/*.woff2 与 font-face.css
 *   node tools/build-fonts.mjs --check   # 只校验：产物是否与当前内容同步（CI 用）
 *
 * 源字体：Noto Sans SC VF 有 17 MB、霞鹜文楷每个字重约 25 MB，都不进仓库；
 * 缺失时自动从上游下载到 tools/.cache/（已 gitignore）。仓库只提交生成后的子集。
 * 唯一例外是 Maple Mono CN：上游只提供 140 MB 的 zip，需手动放一次（见下方常量）。
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

/* 中文主字体：霞鹜文楷**标准版**（不是 Screen 版）。
   Screen 版笔画更细、更适合高 DPI 屏，但 Windows 的 DirectWrite 渲染 16-17px
   小字号时会明显发灰发虚；标准版笔画饱满，同字号下清晰度高一个档次。
   上游只发布静态字重、没有可变轴，因此不做 variationAxes 裁剪；
   这里取 Regular 作正文、Medium 作标题 —— 让 font-weight:600 命中真实字形，
   而不是浏览器用描边合成的"假粗"（中文合成粗体会糊、字距不均）。 */
const LXGW_REGULAR_URL =
  'https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Regular.ttf';
const LXGW_MEDIUM_URL =
  'https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Medium.ttf';
const LXGW_REGULAR_CACHE = path.join(CACHE_DIR, 'LXGWWenKai-Regular.ttf');
const LXGW_MEDIUM_CACHE = path.join(CACHE_DIR, 'LXGWWenKai-Medium.ttf');

/* 等宽字体：Maple Mono CN（连字美观，中文由霞鹜文楷补全）。
   上游只把 CN 版打包进 140 MB 的 MapleMono-CN.zip，没有单文件直链，
   不适合在构建脚本里自动下载，因此改为"手动放一次，之后一直复用"：
   从 https://github.com/subframe7536/maple-font/releases/latest 下载
   MapleMono-CN.zip，解压出 MapleMono-CN-Regular.ttf 放到 tools/.cache/ 即可。
   文件缺失时只告警并跳过，等宽自动回退到 JetBrains Mono，不会中断构建。 */
const MAPLE_SRC = path.join(CACHE_DIR, 'MapleMono-CN-Regular.ttf');
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

/* github.com 在部分网络下直连超时，按顺序回退到镜像，避免构建卡死。 */
const DOWNLOAD_MIRRORS = [null, 'https://gh-proxy.com/'];

async function download(url, dest, size = '约 17 MB') {
  for (const [index, mirror] of DOWNLOAD_MIRRORS.entries()) {
    const target = mirror ? mirror + url : url;
    try {
      console.log(
        `下载源字体 → ${path.relative(root, dest)}（${size}，只需一次）` +
          (mirror ? ` · 镜像 ${new URL(mirror).host}` : '')
      );
      const res = await fetch(target);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (error) {
      if (index === DOWNLOAD_MIRRORS.length - 1) throw error;
      console.log(`  下载失败（${error.message}），换镜像重试`);
    }
  }
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
  // 保留 kern/liga/calt：body 上的 font-feature-settings 需要这些表才生效，
  // 中文字形占体积的绝大部分，GSUB 表带来的增量可以忽略。
  keepFeatures = ['kern', 'liga', 'calt'],
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
    keepFeatures,
    // 必须保留 hinting：Windows 渲染 16-17px 中文靠它做网格对齐，
    // 去掉后笔画会发灰、发虚（macOS 不做 hinting，所以看不出差异）。
    noHinting: false,
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
      family: 'LXGW WenKai',
      source: LXGW_REGULAR_CACHE,
      chars,
      weights: [400, 400],
      fileName: 'lxgw-wenkai-regular-subset.woff2',
      variable: false,
      downloadUrl: LXGW_REGULAR_URL,
      downloadSize: '约 25 MB',
    })
  );
  faces.push(
    await buildFace({
      family: 'LXGW WenKai',
      source: LXGW_MEDIUM_CACHE,
      chars,
      // 真实 Medium 字形谎报成 600：让标题/strong 精确命中，不再触发合成粗体
      weights: [600, 600],
      fileName: 'lxgw-wenkai-medium-subset.woff2',
      variable: false,
      downloadUrl: LXGW_MEDIUM_URL,
      downloadSize: '约 25 MB',
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

  // Maple Mono CN：可选增强，文件缺失就跳过（等宽继续用 JetBrains Mono）
  if (fs.existsSync(MAPLE_SRC)) {
    faces.push(
      await buildFace({
        family: 'Maple Mono CN',
        source: MAPLE_SRC,
        chars,
        weights: [400, 400],
        fileName: 'maple-mono-cn-subset.woff2',
        variable: false,
      })
    );
  } else {
    console.log(`  Maple Mono CN: 跳过（未找到 ${path.relative(root, MAPLE_SRC)}）`);
  }

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
