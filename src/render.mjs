/**
 * 极简 Markdown 渲染器（零依赖）
 * 支持：标题 / 段落 / 列表 / 引用 / 代码块 / 行内代码 / 粗斜体 / 链接 / 图片 / 分割线
 */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function slugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

function stripInline(str) {
  return String(str).replace(/[`*_~]/g, '');
}

function inline(src) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000C${codes.length - 1}\u0000`;
  });

  s = esc(s);

  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
    return `<img src="${url}" alt="${alt}" loading="lazy" decoding="async">`;
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    const ext = /^https?:\/\//i.test(url);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${attrs}>${text}</a>`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  s = s.replace(/\u0000C(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

const BLOCK_START = /^(#{1,4}\s|```|>\s?|[-*+]\s|\d+[.)]\s|\|)/;

export function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // 代码块
    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      const buf = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      const langAttr = lang ? ` data-lang="${esc(lang)}"` : '';
      out.push(`<pre${langAttr}><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // 标题
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      out.push(`<h${level} id="${slugify(stripInline(text))}">${inline(text)}</h${level}>`);
      i += 1;
      continue;
    }

    // 分割线
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i += 1;
      continue;
    }

    // 表格
    if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const cells = (l) =>
        l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head
          .map((h) => `<th>${inline(h)}</th>`)
          .join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      continue;
    }

    // 引用
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'))}</blockquote>`);
      continue;
    }

    // 无序列表
    if (/^[-*+]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^[-*+]\s+/, ''));
        i += 1;
      }
      out.push('<ul>' + buf.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>');
      continue;
    }

    // 有序列表
    if (/^\d+[.)]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      out.push('<ol>' + buf.map((t) => `<li>${inline(t)}</li>`).join('') + '</ol>');
      continue;
    }

    // 段落
    const buf = [];
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) break;
      if (BLOCK_START.test(l)) break;
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) break;
      buf.push(l.trim());
      i += 1;
    }
    if (!buf.length) {
      buf.push(line.trim());
      i += 1;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return out.join('\n');
}

/** 粗略统计阅读时长：中文按 380 字/分钟，英文按 200 词/分钟 */
export function readingTime(md) {
  const plain = String(md).replace(/```[\s\S]*?```/g, ' ');
  const cjk = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 380 + words / 200));
}
