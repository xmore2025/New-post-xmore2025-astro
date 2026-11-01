/**
 * 排印实验室（/typography/）
 *
 * 三件事：
 *   1. 四个滑杆 → 写进 --t-* 自定义属性，样张实时重排；
 *   2. 六个修饰开关 → 只加减 class，不动任何字号；
 *   3. 样张文字 contenteditable，按 data-sync 的键广播到全部卡片。
 *
 * 只在这一页加载（由 typography.astro 的 <script> 引入），不进全站包。
 */

import { $, $$, on, prefersReducedMotion } from './dom.js';

const TEXT_KEY = 'xmore:type-text';

/**
 * 规则表：与 lib/specimens.ts 的 RULES 一一对应，判定区间也写在这里。
 *
 * 字号上限取 13pt 而不是 12pt：这套区间原本是给宋体/黑体定的，楷体中宫小、
 * 字面只占 em 的八成多，同字号视觉小一档，需要 +1pt 补偿。站点正文 17px
 * 就是 12.75pt —— 按 12pt 判会把自己判成越界。
 */
const RULES = {
  size: { test: (v) => v >= 10.5 && v <= 13, fmt: (v) => `${trimNum(v)} pt` },
  lh: { test: (v) => v >= 1.5 && v <= 1.75, fmt: (v) => v.toFixed(2) },
  measure: { test: (v) => v >= 30 && v <= 40, fmt: (v) => `${v} 字` },
  gap: { test: (v) => v >= 0.5 && v <= 1, fmt: (v) => `${v.toFixed(2)} 行` },
  families: { test: (v) => v <= 3, fmt: (v) => `${v} 种` },
};

const FLAGS = ['trim', 'indent', 'tabular', 'autospace', 'pretty', 'grid'];

/** 11.50 → 11.5；12.00 → 12 */
const trimNum = (value) => String(Number(value.toFixed(2)));

const readStored = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(TEXT_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const writeStored = (data) => {
  try {
    localStorage.setItem(TEXT_KEY, JSON.stringify(data));
  } catch {
    /* 隐私模式下写不进去，忽略即可 */
  }
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* 落到下面的兜底 */
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
};

/** 按钮上短暂显示一句反馈，然后还原 */
const flash = (btn, label = '已复制') => {
  const original = btn.innerHTML;
  btn.classList.add('is-done');
  btn.textContent = label;
  window.setTimeout(() => {
    btn.classList.remove('is-done');
    btn.innerHTML = original;
  }, 1500);
};

export const initSpecimen = () => {
  const lab = $('#lab');
  if (!lab) return;

  const sample = $('#lab-sample');
  const cssOut = $('[data-css-out]');
  if (!sample || !cssOut) return;

  /* ---------------- 状态 ---------------- */
  const state = {
    size: 11.5,
    lh: 1.6,
    measure: 34,
    gap: 0.75,
    families: 1,
    font: lab.dataset.font || 'system-ui, sans-serif',
    trim: true,
    indent: false,
    tabular: false,
    autospace: false,
    pretty: true,
    grid: false,
  };

  const buildCss = () => {
    const lines = [
      '.article-body {',
      `  font-family: ${state.font};`,
      `  font-size: ${trimNum(state.size)}pt;`,
      `  line-height: ${state.lh.toFixed(2)};`,
      `  max-width: ${state.measure}em;`,
    ];
    if (state.indent) lines.push('  text-indent: 2em;');
    if (state.trim) lines.push('  text-spacing-trim: trim-start;');
    if (state.autospace) lines.push('  text-autospace: normal;');
    if (state.tabular) lines.push('  font-variant-numeric: tabular-nums;');
    if (state.pretty) lines.push('  text-wrap: pretty;');
    lines.push(
      '}',
      '',
      '.article-body p + p {',
      `  margin-top: ${(state.gap * state.lh).toFixed(2)}em;`,
      '}'
    );
    return lines.join('\n');
  };

  /* ---------------- 渲染 ---------------- */
  const apply = () => {
    sample.style.setProperty('--t-size', `${trimNum(state.size)}pt`);
    sample.style.setProperty('--t-lh', state.lh.toFixed(2));
    sample.style.setProperty('--t-measure', `${state.measure}em`);
    sample.style.setProperty('--t-gap', `${(state.gap * state.lh).toFixed(3)}em`);
    sample.style.setProperty('--t-font', state.font);

    /* 行距刻度尺：一格 = 一行 */
    lab.style.setProperty('--lab-step', `calc(${state.lh} * ${trimNum(state.size)}pt)`);
    lab.classList.toggle('is-grid', state.grid);

    sample.classList.toggle('is-indent', state.indent);
    sample.classList.toggle('is-trim', state.trim);
    sample.classList.toggle('is-tabular', state.tabular);
    sample.classList.toggle('is-autospace', state.autospace);
    sample.classList.toggle('is-pretty', state.pretty);

    $$('[data-out]').forEach((out) => {
      const key = out.dataset.out;
      out.textContent = RULES[key].fmt(state[key]);
    });

    /* 行宽是「排出来的结果」，不是「声明的数字」：
       纸面装不下 34em 时会被压成 32 字，检查表必须按实测报，否则读数就是假的。
       但手机上的纸面本来就只有 300px，量出来必然「不合规」——那是屏幕的错，
       不是设置的错，所以窄屏直接按声明值报。 */
    const width = sample.getBoundingClientRect().width;
    const sizePx = parseFloat(getComputedStyle(sample).fontSize) || 16;
    const measurable = window.innerWidth >= 900;
    const values = {
      size: state.size,
      lh: state.lh,
      measure: measurable ? Math.max(1, Math.round(width / sizePx)) : state.measure,
      gap: state.gap,
      families: state.families,
    };

    let pass = 0;
    Object.keys(RULES).forEach((key) => {
      const ok = RULES[key].test(values[key]);
      if (ok) pass += 1;
      const value = RULES[key].fmt(values[key]);
      const check = $(`[data-check="${key}"]`);
      if (check) {
        check.dataset.state = ok ? 'ok' : 'bad';
        const cell = check.querySelector(`[data-check-val="${key}"]`);
        if (cell) cell.textContent = value;
      }
      const rule = $(`[data-rule="${key}"]`);
      if (rule) {
        rule.dataset.state = ok ? 'ok' : 'bad';
        const live = rule.querySelector(`[data-live="${key}"]`);
        if (live) live.textContent = value;
      }
    });

    const score = $('[data-score]');
    if (score) score.textContent = String(pass);
    const scoreBox = $('[data-score-box]');
    if (scoreBox) scoreBox.dataset.state = pass === 5 ? 'ok' : 'bad';

    const verdict = $('[data-verdict]');
    if (verdict) {
      const off = 5 - pass;
      verdict.dataset.state = off ? 'bad' : 'ok';
      verdict.textContent = off
        ? `有 ${off} 项越界 —— 先把标红的改回区间，再谈字体。`
        : '五项全部达标，这套可以直接抄走。';
    }

    cssOut.textContent = buildCss();
  };

  /* ---------------- 滑杆 / 开关 ---------------- */
  $$('[data-ctl]').forEach((input) => {
    on(input, 'input', () => {
      state[input.dataset.ctl] = Number(input.value);
      apply();
    });
  });

  $$('[data-flag]').forEach((input) => {
    const sync = () => {
      state[input.dataset.flag] = input.checked;
      input.closest('.flag')?.classList.toggle('is-on', input.checked);
      apply();
    };
    on(input, 'change', sync);
    input.closest('.flag')?.classList.toggle('is-on', input.checked);
  });

  /* ---------------- 从样张取用 ---------------- */
  const syncInputs = () => {
    $$('[data-ctl]').forEach((input) => {
      const key = input.dataset.ctl;
      if (key in state) input.value = String(state[key]);
    });
    FLAGS.forEach((key) => {
      const input = $(`[data-flag="${key}"]`);
      if (!input) return;
      input.checked = Boolean(state[key]);
      input.closest('.flag')?.classList.toggle('is-on', input.checked);
    });
  };

  $$('[data-apply]').forEach((btn) => {
    on(btn, 'click', () => {
      const card = btn.closest('.spec');
      if (!card) return;

      state.size = Number(card.dataset.size);
      state.lh = Number(card.dataset.lh);
      state.measure = Number(card.dataset.measure);
      state.gap = Number(card.dataset.gap);
      state.font = card.dataset.font || state.font;
      state.families = Number(card.dataset.families);
      state.indent = card.dataset.indent === 'true';

      syncInputs();
      apply();
      flash(btn, `已套用 ${card.dataset.name}`);
      lab.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
    });
  });

  /* ---------------- 复制 ---------------- */
  on($('[data-copy="lab"]'), 'click', async (event) => {
    const btn = event.currentTarget;
    if (await copyText(cssOut.textContent)) flash(btn);
  });

  $$('[data-copy-spec]').forEach((btn) => {
    on(btn, 'click', async () => {
      const tpl = btn.closest('.spec')?.querySelector('.spec-src');
      if (!tpl) return;
      if (await copyText(tpl.content.textContent.trim())) flash(btn);
    });
  });

  /* ---------------- 可编辑文字：一处改动，全卡同步 ---------------- */
  const blocks = $$('[data-sync]');
  if (!blocks.length) {
    apply();
    return;
  }

  const defaults = new Map();
  blocks.forEach((block) => {
    const key = block.dataset.sync;
    if (!defaults.has(key)) defaults.set(key, block.textContent.trim());
  });

  /* 现代浏览器支持 plaintext-only：粘贴与回车都不会带进 HTML。
     不支持的浏览器保持 contenteditable=true，由下面的 paste 处理器兜底。 */
  const supportsPlain = (() => {
    const probe = document.createElement('div');
    probe.setAttribute('contenteditable', 'plaintext-only');
    return probe.contentEditable === 'plaintext-only';
  })();
  if (supportsPlain) {
    blocks.forEach((block) => block.setAttribute('contenteditable', 'plaintext-only'));
  }

  const stored = readStored();
  blocks.forEach((block) => {
    const value = stored[block.dataset.sync];
    if (typeof value === 'string' && value.trim()) block.textContent = value;
  });

  let saveTimer = 0;
  const queueSave = () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      const data = {};
      blocks.forEach((block) => {
        const key = block.dataset.sync;
        if (!(key in data)) data[key] = block.textContent;
      });
      writeStored(data);
    }, 400);
  };

  const broadcast = (source) => {
    const key = source.dataset.sync;
    const text = source.textContent;

    if (!supportsPlain && source.firstElementChild) {
      /* 兜底：真·富文本浏览器插入了标签，抹平成纯文本 */
      source.textContent = text;
    }

    blocks.forEach((block) => {
      if (block === source || block.dataset.sync !== key) return;
      if (block.textContent !== text) block.textContent = text;
    });
    queueSave();
  };

  blocks.forEach((block) => {
    on(block, 'input', () => broadcast(block));

    /* 单段编辑：回车会破坏样张的行距节奏，直接吃掉 */
    on(block, 'keydown', (event) => {
      if (event.key === 'Enter') event.preventDefault();
    });

    on(block, 'paste', (event) => {
      if (supportsPlain) return;
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (text) document.execCommand('insertText', false, text);
    });
  });

  on($('[data-reset-text]'), 'click', () => {
    blocks.forEach((block) => {
      block.textContent = defaults.get(block.dataset.sync) ?? '';
    });
    try {
      localStorage.removeItem(TEXT_KEY);
    } catch {
      /* 忽略 */
    }
  });

  apply();
};
