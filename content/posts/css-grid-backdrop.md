---
title: 用纯 CSS 画一层克制的网格背景
description: 一个 12 行的方案：双层线性渐变 + 径向遮罩，让背景有秩序感，但永远不会抢正文的注意力。
date: 2025-09-23
tags: [css, design]
---

很多开发者主页都会加一层网格背景，用来暗示"这是一个工程感的空间"。但十有八九做得太重：线条太深、范围太大、还带一点发光，结果整页看起来像一张草稿纸。

这篇文章拆一个我认为恰到好处的版本。

## 核心只有三层

```css
.backdrop {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.backdrop-grid {
  position: absolute;
  inset: -1px;
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 80px 80px;
  -webkit-mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, #000 0%, transparent 78%);
  mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, #000 0%, transparent 78%);
}
```

三个关键点：

1. **两条 1px 渐变**画出正交网格，不需要 SVG，也不需要图片
2. **`mask-image` 做径向遮罩**，让网格只在页面上方隐约出现，向下自然消失
3. **`inset: -1px`** 消除边缘的半个像素误差

## 线条的透明度是成败关键

我试过的取值：

| 透明度 | 效果 |
| --- | --- |
| `rgba(0,0,0,.10)` | 像草稿纸，抢戏 |
| `rgba(0,0,0,.06)` | 偏重，长文会累 |
| `rgba(0,0,0,.045)` | 刚好，能感知但不干扰 |
| `rgba(0,0,0,.02)` | 几乎看不见，不如不加 |

深色模式下不要简单反转颜色。白色线条在深色背景上的视觉重量远大于黑色线条在浅色背景上，所以数值要更低：

```css
[data-theme="dark"] {
  --grid-line: rgba(255, 255, 255, 0.042);
}
```

## 别忘了层级

背景层最容易犯的错是 `z-index` 处理不当，把正文盖住。我的做法是：

```css
.backdrop { z-index: 0; }
main      { position: relative; z-index: 1; }
```

背景固定、正文滚动。这样滚动时网格是静止的，视觉上更稳，性能也更好——`position: fixed` 加渐变在移动端不会触发大面积重绘。

## 如果想再克制一点

可以考虑把网格的垂直间距做成 8 的倍数（比如 80px），让背景的节奏和正文的间距系统对齐。这是一个几乎没人会注意到的细节，但正是这类细节让页面"看起来是对的"。

最后一句：**背景的任务是让内容更好读，而不是让人注意到背景。** 任何时候你开始为它调参数超过十分钟，就应该把它删掉。
