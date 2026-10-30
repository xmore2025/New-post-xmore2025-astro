import fs from 'node:fs';
import path from 'node:path';

/**
 * 首屏字体的 preload 列表。
 *
 * @font-face 由 tools/build-fonts.mjs 生成，URL 带内容哈希，只能在构建时解析。
 * 解析结果缓存在模块作用域：20 个页面共用一次读取，也避免每个页面重复跑正则。
 */
let cache: string[] | undefined;

export function getPreloadedFonts(): string[] {
  if (cache) return cache;

  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/font-face.css'), 'utf8');
  cache = [...css.matchAll(/url\("([^"]+)"\)/g)]
    .map((match) => match[1])
    .filter((href) => /lxgw|jetbrains/.test(href));

  return cache;
}
