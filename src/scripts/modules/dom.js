/**
 * 极小 DOM 工具集：全站脚本共用，避免每个模块重复实现。
 */

export const $ = (selector, scope = document) => scope.querySelector(selector);

export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const on = (target, type, handler, options) => {
  if (target) target.addEventListener(type, handler, options);
};

/** 把高频事件（滚动 / 缩放）压到每个动画帧最多执行一次 */
export const rafThrottle = (fn) => {
  let frame = 0;
  return (...args) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      fn(...args);
    });
  };
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
