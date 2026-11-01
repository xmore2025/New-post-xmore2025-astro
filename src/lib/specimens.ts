/**
 * 排印样张数据：/typography/ 页面与 TypeSpecimen 组件的唯一来源。
 *
 * 五套方案的取值不是随手写的，每一条都落在硬规则内（演示大屏除外，
 * 它是刻意越界的对照组）：
 *   字号 10.5–13pt · 行距 1.5–1.75 · 行宽 30–40 字 · 段距 0.5–1 行 · 字体 ≤ 3 种
 *
 * 字号上限取 13pt 而非 12pt：这套区间原本按宋体/黑体定，楷体字面小一档，
 * 需要 +1pt 补偿（站点正文 17px = 12.75pt 正好落在区间内）。
 *
 * font 里刻意保留系统字体回退：宋体 / 楷体不额外下载字体文件，
 * 用 macOS 的 Songti SC、Kaiti SC 与 Windows 的 SimSun、KaiTi 兜住。
 */

export interface Specimen {
  id: string;
  index: string;
  name: string;
  en: string;
  /** 适用场景，显示在卡片头部 */
  use: string;
  /** 一句话说明，显示在卡片脚部 */
  note: string;
  font: string;
  /** 标题可换族（经典正式 = 黑体标题 + 宋体正文） */
  titleFont?: string;
  /** 等宽族，缺省用站点自己的 --font-mono */
  mono?: string;
  /** 字号，pt */
  size: number;
  /** 行高，倍数 */
  lh: number;
  /** 行宽，汉字数（1em = 1 个汉字） */
  measure: number;
  /** 段间距，行 */
  gap: number;
  /** 标题字重 */
  weight: number;
  /** 标题字距 */
  tracking: string;
  /** 标题相对正文的倍数 */
  titleScale: number;
  /** 首行缩进 2em */
  indent: boolean;
  /** 实际使用的字族数（不含等宽与系统兜底） */
  families: number;
  /** 越界说明：只有演示大屏需要 */
  exception?: string;
}

const SERIF =
  "'Songti SC', 'STSong', 'SimSun', 'Source Han Serif SC', 'Noto Serif SC', Georgia, serif";
const KAI = "'LXGW WenKai', 'Kaiti SC', 'STKaiti', 'KaiTi', 'TW-Kai', serif";
const SANS =
  "'Inter Variable', 'Noto Sans SC Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', -apple-system, 'Segoe UI', sans-serif";
const HEI =
  "'Noto Sans SC Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', -apple-system, sans-serif";
const MONO =
  "'JetBrains Mono Variable', 'Maple Mono CN', ui-monospace, 'SF Mono', Consolas, monospace";

export const SPECIMENS: Specimen[] = [
  {
    id: 'classic',
    index: '01',
    name: '经典正式',
    en: 'CLASSIC FORMAL',
    use: '公文 · 长文 · 正式文稿',
    note: '黑体标题压住层级，宋体正文靠横细竖粗撑密度。首行缩进 2em，段间只留半行——这是纸面公文沿用了六十年的节奏。',
    font: SERIF,
    titleFont: HEI,
    size: 12,
    lh: 1.75,
    measure: 34,
    gap: 0.6,
    weight: 700,
    tracking: '0.01em',
    titleScale: 1.5,
    indent: true,
    families: 2,
  },
  {
    id: 'business',
    index: '02',
    name: '现代商务',
    en: 'MODERN BUSINESS',
    use: '产品文档 · 提案 · 邮件',
    note: '无衬线 + 紧凑行距，把信息密度拉到最高。行宽 38 字、段距 0.6 行，是扫描式阅读最省力的组合。',
    font: SANS,
    size: 11,
    lh: 1.6,
    measure: 38,
    gap: 0.6,
    weight: 650,
    tracking: '-0.01em',
    titleScale: 1.4,
    indent: false,
    families: 2,
  },
  {
    id: 'reading',
    index: '03',
    name: '人文阅读',
    en: 'HUMANIST READING',
    use: '随笔 · 散文 · 长阅读',
    note: '楷体自带手写的温度，但字面小、笔画细，需要更宽的行距与更窄的行宽补偿。全篇一种字体，只靠字号分层级。',
    font: KAI,
    size: 12,
    lh: 1.75,
    measure: 32,
    gap: 0.9,
    weight: 600,
    tracking: '0',
    titleScale: 1.45,
    indent: false,
    families: 1,
  },
  {
    id: 'stage',
    index: '04',
    name: '演示大屏',
    en: 'PRESENTATION',
    use: '幻灯片 · 大屏 · 海报',
    note: '字号几乎翻倍、行宽收到 20 字，行距反而要收紧——远距离阅读靠的是行块轮廓，不是逐行呼吸。这三项是刻意越界的。',
    font: HEI,
    size: 20,
    lh: 1.45,
    measure: 20,
    gap: 1,
    weight: 700,
    tracking: '-0.02em',
    titleScale: 1.3,
    indent: false,
    families: 1,
    exception: '字号 / 行距 / 行宽按屏幕距离放大，不套用纸面参数',
  },
  {
    id: 'tech',
    index: '05',
    name: '技术文档',
    en: 'TECHNICAL DOCS',
    use: 'README · API 手册 · 变更日志',
    note: '最小字号配最大行宽，用等宽代码块切开长段落。正文压到 10.5pt，是因为读者的注意力一半在屏幕上、一半在编辑器里。',
    font: SANS,
    mono: MONO,
    size: 10.5,
    lh: 1.65,
    measure: 40,
    gap: 0.55,
    weight: 650,
    tracking: '-0.005em',
    titleScale: 1.35,
    indent: false,
    families: 3,
  },
];

/** 所有样张共用同一段文字：改一处，五张卡同步。 */
export const SAMPLE = {
  title: '让文字先于设计被读懂',
  lead: '排印不是装饰，是把作者的呼吸翻译成像素。字号、行距、行宽、段距、字体数量——这五项一旦失衡，再讲究的字形也救不回来。',
  body: '汉字方块几乎填满字身框，同样的字号下比拉丁字母更重、更密。行距因此不能照搬西文：1.5 是底线，1.6 起步，1.75 才从容。每行 30–40 字，是眼睛从行尾折返行首时不会走错的距离。',
  quote: '留白不是空的，那是读者思考的地方。',
  note: '行宽用 max-width 锁定在 34em，再用 text-wrap: pretty 收掉最后一行只剩一两个字的孤行。',
  code: 'max-width: 34em; line-height: 1.75;',
};

/** 五条硬规则：试验台的检查表与页面顶部的规则条共用。 */
export const RULES = [
  { key: 'size', name: '字号', spec: '10.5–13 pt', init: '11.5 pt' },
  { key: 'lh', name: '行距', spec: '1.5–1.75', init: '1.60' },
  { key: 'measure', name: '行宽', spec: '30–40 字', init: '34 字' },
  { key: 'gap', name: '段距', spec: '0.5–1 行', init: '0.75 行' },
  { key: 'families', name: '字体', spec: '≤ 3 种', init: '1 种' },
] as const;
