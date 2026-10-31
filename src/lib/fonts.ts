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
  const hrefs = [...css.matchAll(/url\("([^"]+)"\)/g)].map((match) => match[1]);

  // 正文 Regular 必预载；Medium 只用在标题，等 FOUT 比多下一份字体划算。
  // 等宽同理二选一：Maple Mono 生成了就预载它，否则退回 JetBrains Mono。
  const mono = hrefs.filter((href) => href.includes('maple'));
  cache = [
    ...hrefs.filter((href) => href.includes('lxgw-wenkai-regular')),
    ...(mono.length ? mono : hrefs.filter((href) => href.includes('jetbrains'))),
  ];

  return cache;
}
