import { useState, useEffect, useRef, Component, useCallback, useMemo, useLayoutEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { animate, AnimatePresence, motion } from 'framer-motion';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

// src/components/GooeyToaster.tsx

// src/presets.ts
var animationPresets = {
  smooth: { bounce: 0.1, spring: true },
  bouncy: { bounce: 0.6, spring: true },
  subtle: { bounce: 0.05, spring: true },
  snappy: { bounce: 0.4, spring: true }
};

// src/context.ts
var _position = "bottom-right";
var _dir = "ltr";
var _spring = true;
var _bounce = void 0;
var _theme = "light";
function setGooeyTheme(theme) {
  _theme = theme;
}
function getGooeyTheme() {
  return _theme;
}
function setGooeyPosition(position) {
  _position = position;
}
function getGooeyPosition() {
  return _position;
}
function setGooeyDir(dir) {
  _dir = dir;
}
function getGooeyDir() {
  return _dir;
}
function setGooeySpring(spring) {
  _spring = spring;
}
function getGooeySpring() {
  return _spring;
}
function setGooeyBounce(bounce) {
  _bounce = bounce;
}
function getGooeyBounce() {
  return _bounce;
}
var _visibleToasts = 3;
function setGooeyVisibleToasts(n) {
  _visibleToasts = n;
}
function getGooeyVisibleToasts() {
  return _visibleToasts;
}
var _swipeToDismiss = true;
function setGooeySwipeToDismiss(enabled) {
  _swipeToDismiss = enabled;
}
function getGooeySwipeToDismiss() {
  return _swipeToDismiss;
}
var _maxQueue = Infinity;
function setGooeyMaxQueue(n) {
  _maxQueue = n;
}
function getGooeyMaxQueue() {
  return _maxQueue;
}
var _queueOverflow = "drop-oldest";
function setGooeyQueueOverflow(strategy) {
  _queueOverflow = strategy;
}
function getGooeyQueueOverflow() {
  return _queueOverflow;
}
var _showProgress = false;
function setGooeyShowProgress(show) {
  _showProgress = show;
}
function getGooeyShowProgress() {
  return _showProgress;
}
var _containerHovered = false;
var _hoverSubs = /* @__PURE__ */ new Set();
function setContainerHovered(hovered) {
  if (_containerHovered === hovered) return;
  _containerHovered = hovered;
  _hoverSubs.forEach((cb) => cb(hovered));
}
function getContainerHovered() {
  return _containerHovered;
}
function subscribeContainerHovered(cb) {
  _hoverSubs.add(cb);
  return () => {
    _hoverSubs.delete(cb);
  };
}
var _announceSubs = /* @__PURE__ */ new Set();
function announce(message, politeness = "polite") {
  _announceSubs.forEach((cb) => cb({ message, politeness }));
}
function subscribeAnnouncements(cb) {
  _announceSubs.add(cb);
  return () => {
    _announceSubs.delete(cb);
  };
}
var DefaultIcon = ({ size = 20, className }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: [
      /* @__PURE__ */ jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
      /* @__PURE__ */ jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
    ]
  }
);
var SuccessIcon = ({ size = 20, className }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsx("path", { d: "M9 12l2 2 4-4" })
    ]
  }
);
var ErrorIcon = ({ size = 20, className }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsx("path", { d: "M15 9l-6 6" }),
      /* @__PURE__ */ jsx("path", { d: "M9 9l6 6" })
    ]
  }
);
var WarningIcon = ({ size = 20, className }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
    ]
  }
);
var InfoIcon = ({ size = 20, className }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
    ]
  }
);
var SpinnerIcon = ({ size = 20, className }) => /* @__PURE__ */ jsx(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
  }
);
var QUERY = "(prefers-reduced-motion: reduce)";
function getInitialState() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(QUERY);
    const handler = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return prefersReducedMotion;
}

// src/components/gooey-styles.ts
var styles = {
  spinnerSpin: "gooey-spinnerSpin",
  wrapper: "gooey-wrapper",
  blobSvg: "gooey-blobSvg",
  content: "gooey-content",
  contentCompact: "gooey-contentCompact",
  contentExpanded: "gooey-contentExpanded",
  header: "gooey-header",
  iconWrapper: "gooey-iconWrapper",
  title: "gooey-title",
  titleDefault: "gooey-titleDefault",
  titleSuccess: "gooey-titleSuccess",
  titleError: "gooey-titleError",
  titleWarning: "gooey-titleWarning",
  titleInfo: "gooey-titleInfo",
  titleLoading: "gooey-titleLoading",
  description: "gooey-description",
  actionWrapper: "gooey-actionWrapper",
  actionButton: "gooey-actionButton",
  actionDefault: "gooey-actionDefault",
  actionSuccess: "gooey-actionSuccess",
  actionError: "gooey-actionError",
  actionWarning: "gooey-actionWarning",
  actionInfo: "gooey-actionInfo",
  progressWrapper: "gooey-progressWrapper",
  progressBar: "gooey-progressBar",
  progressDefault: "gooey-progressDefault",
  progressSuccess: "gooey-progressSuccess",
  progressError: "gooey-progressError",
  progressWarning: "gooey-progressWarning",
  progressInfo: "gooey-progressInfo",
  progressPaused: "gooey-progressPaused",
  timestamp: "gooey-timestamp"
};
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
var phaseIconMap = {
  default: DefaultIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon
};
var titleColorMap = {
  loading: styles.titleLoading,
  default: styles.titleDefault,
  success: styles.titleSuccess,
  error: styles.titleError,
  warning: styles.titleWarning,
  info: styles.titleInfo
};
var actionColorMap = {
  loading: styles.actionInfo,
  default: styles.actionDefault,
  success: styles.actionSuccess,
  error: styles.actionError,
  warning: styles.actionWarning,
  info: styles.actionInfo
};
var progressColorMap = {
  loading: styles.progressInfo,
  default: styles.progressDefault,
  success: styles.progressSuccess,
  error: styles.progressError,
  warning: styles.progressWarning,
  info: styles.progressInfo
};
var PH = 34;
var DEFAULT_DISPLAY_DURATION = 4e3;
var DEFAULT_EXPAND_DUR = 0.6;
var DEFAULT_COLLAPSE_DUR = 0.9;
function squishSpring(durationSec, defaultDur, bounce = 0.4) {
  const scale = durationSec / defaultDur;
  const stiffness = 200 + bounce * 437.5;
  const damping = 24 - bounce * 20;
  const mass = 0.7 * scale;
  return { type: "spring", stiffness, damping, mass };
}
var observerRegistry = /* @__PURE__ */ new Map();
function registerSonnerObserver(ol, callback) {
  let entry = observerRegistry.get(ol);
  if (!entry) {
    const callbacks = /* @__PURE__ */ new Set();
    let applying = false;
    const observer = new MutationObserver(() => {
      if (applying) return;
      applying = true;
      requestAnimationFrame(() => {
        callbacks.forEach((cb) => cb());
        requestAnimationFrame(() => {
          applying = false;
        });
      });
    });
    observer.observe(ol, {
      attributes: true,
      attributeFilter: ["style", "data-visible"],
      subtree: true,
      childList: true
    });
    entry = { observer, callbacks };
    observerRegistry.set(ol, entry);
  }
  entry.callbacks.add(callback);
  return () => {
    entry.callbacks.delete(callback);
    if (entry.callbacks.size === 0) {
      entry.observer.disconnect();
      observerRegistry.delete(ol);
    }
  };
}
function syncSonnerHeights(wrapperEl, includeOffsets = false) {
  if (!wrapperEl) return;
  const li = wrapperEl.closest("[data-sonner-toast]");
  if (!li?.parentElement) return;
  const ol = li.parentElement;
  const toasts = Array.from(
    ol.querySelectorAll(":scope > [data-sonner-toast]")
  );
  if (toasts.length === 0) return;
  const heights = toasts.map((t) => {
    if (t.getAttribute("data-visible") === "false") return 0;
    const content = t.firstElementChild;
    const h = content ? content.getBoundingClientRect().height : 0;
    return h > 0 ? h : PH;
  });
  const isExpanded = includeOffsets && toasts[0]?.getAttribute("data-expanded") === "true";
  if (isExpanded) {
    for (const t of toasts) t.style.setProperty("transition", "none", "important");
  }
  for (let i = 0; i < toasts.length; i++) {
    toasts[i].style.setProperty("--initial-height", `${heights[i]}px`);
  }
  if (!includeOffsets) {
    if (isExpanded) {
      for (const t of toasts) t.style.removeProperty("transition");
    }
    return;
  }
  const gapStr = getComputedStyle(ol).getPropertyValue("--gap").trim();
  const gap = parseFloat(gapStr) || 14;
  let runningOffset = 0;
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].getAttribute("data-visible") === "false") {
      toasts[i].style.setProperty("--offset", "0px");
      continue;
    }
    toasts[i].style.setProperty("--offset", `${runningOffset}px`);
    if (i > 0) {
      runningOffset += heights[i] + gap;
    }
  }
  if (isExpanded) {
    void ol.offsetHeight;
    for (const t of toasts) t.style.removeProperty("transition");
  }
}
function memoizePath(fn) {
  let lastArgs = null;
  let lastResult = "";
  return (pw, bw, th, t) => {
    if (lastArgs && lastArgs[0] === pw && lastArgs[1] === bw && lastArgs[2] === th && lastArgs[3] === t) {
      return lastResult;
    }
    lastResult = fn(pw, bw, th, t);
    lastArgs = [pw, bw, th, t];
    return lastResult;
  };
}
function morphPathRaw(pw, bw, th, t) {
  const pr = PH / 2;
  const pillW = Math.min(pw, bw);
  const bodyH = PH + (th - PH) * t;
  if (t <= 0 || bodyH - PH < 8) {
    return [
      `M 0,${pr}`,
      `A ${pr},${pr} 0 0 1 ${pr},0`,
      `H ${pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW - pr},${PH}`,
      `H ${pr}`,
      `A ${pr},${pr} 0 0 1 0,${pr}`,
      `Z`
    ].join(" ");
  }
  const curve = 14 * t;
  const cr = Math.min(16, (bodyH - PH) * 0.45);
  const bodyW = pillW + (bw - pillW) * t;
  const bodyTop = PH - curve;
  const qEndX = Math.min(pillW + curve, bodyW - cr);
  return [
    `M 0,${pr}`,
    `A ${pr},${pr} 0 0 1 ${pr},0`,
    `H ${pillW - pr}`,
    `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
    `L ${pillW},${bodyTop}`,
    `Q ${pillW},${bodyTop + curve} ${qEndX},${bodyTop + curve}`,
    `H ${bodyW - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW},${bodyTop + curve + cr}`,
    `L ${bodyW},${bodyH - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW - cr},${bodyH}`,
    `H ${cr}`,
    `A ${cr},${cr} 0 0 1 0,${bodyH - cr}`,
    `Z`
  ].join(" ");
}
function morphPathCenterRaw(pw, bw, th, t) {
  const pr = PH / 2;
  const pillW = Math.min(pw, bw);
  const pillOffset = (bw - pillW) / 2;
  if (t <= 0 || PH + (th - PH) * t - PH < 8) {
    return [
      `M ${pillOffset},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
      `H ${pillOffset + pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW - pr},${PH}`,
      `H ${pillOffset + pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset},${pr}`,
      `Z`
    ].join(" ");
  }
  const bodyH = PH + (th - PH) * t;
  const curve = 14 * t;
  const cr = Math.min(16, (bodyH - PH) * 0.45);
  const bodyTop = PH - curve;
  const bodyCenter = bw / 2;
  const halfBodyW = pillW / 2 + (bw - pillW) / 2 * t;
  const bodyLeft = bodyCenter - halfBodyW;
  const bodyRight = bodyCenter + halfBodyW;
  const qLeftX = Math.max(bodyLeft + cr, pillOffset - curve);
  const qRightX = Math.min(bodyRight - cr, pillOffset + pillW + curve);
  return [
    // Start at left side of pill
    `M ${pillOffset},${pr}`,
    // Pill top-left arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
    // Top edge of pill
    `H ${pillOffset + pillW - pr}`,
    // Pill top-right arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
    // Right side down to body junction
    `L ${pillOffset + pillW},${bodyTop}`,
    // Right organic curve from pill to body
    `Q ${pillOffset + pillW},${bodyTop + curve} ${qRightX},${bodyTop + curve}`,
    // Right side of body
    `H ${bodyRight - cr}`,
    // Body top-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight},${bodyTop + curve + cr}`,
    // Right edge down
    `L ${bodyRight},${bodyH - cr}`,
    // Body bottom-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight - cr},${bodyH}`,
    // Bottom edge
    `H ${bodyLeft + cr}`,
    // Body bottom-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft},${bodyH - cr}`,
    // Left edge up
    `L ${bodyLeft},${bodyTop + curve + cr}`,
    // Body top-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft + cr},${bodyTop + curve}`,
    // Left side of body
    `H ${qLeftX}`,
    // Left organic curve from body to pill
    `Q ${pillOffset},${bodyTop + curve} ${pillOffset},${bodyTop}`,
    // Close back to start
    `Z`
  ].join(" ");
}
var morphPath = memoizePath(morphPathRaw);
var morphPathCenter = memoizePath(morphPathCenterRaw);
var SMOOTH_EASE = [0.4, 0, 0.2, 1];
var GooeyToast = ({
  title,
  description,
  action,
  icon,
  phase,
  classNames,
  fillColor: fillColorProp,
  borderColor,
  borderWidth,
  timing,
  preset,
  spring: springProp,
  bounce: bounceProp,
  showProgress: showProgressProp,
  toastId
}) => {
  const theme = getGooeyTheme();
  const fillColor = fillColorProp ?? (theme === "dark" ? "#1a1a1a" : "#ffffff");
  const position = getGooeyPosition();
  const dir = getGooeyDir();
  const posIsRight = position?.includes("right") ?? false;
  const isCenter = position?.includes("center") ?? false;
  const isRight = dir === "rtl" ? isCenter ? false : !posIsRight : posIsRight;
  const prefersReducedMotion = usePrefersReducedMotion();
  const presetConfig = preset ? animationPresets[preset] : void 0;
  const useSpring = springProp ?? presetConfig?.spring ?? getGooeySpring();
  const bounceVal = bounceProp ?? presetConfig?.bounce ?? getGooeyBounce() ?? 0.4;
  const showProgress = showProgressProp ?? getGooeyShowProgress();
  const [actionSuccess, setActionSuccess] = useState(null);
  const [dismissing, setDismissing] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const containerHoveredRef = useRef(getContainerHovered());
  const [containerHovered, setContainerHoveredState] = useState(getContainerHovered());
  const collapsingRef = useRef(false);
  const preDismissRef = useRef(false);
  const collapseEndTime = useRef(0);
  const expandedDimsRef = useRef({ pw: 0, bw: 0, th: 0 });
  const dismissTimerRef = useRef(null);
  const effectiveTitle = actionSuccess ?? title;
  const effectivePhase = actionSuccess ? "success" : phase;
  const effectiveDescription = actionSuccess ? void 0 : description;
  const effectiveAction = actionSuccess ? void 0 : action;
  const isLoading = effectivePhase === "loading";
  const hasDescription = Boolean(effectiveDescription);
  const hasAction = Boolean(effectiveAction);
  const isExpanded = (hasDescription || hasAction) && !dismissing;
  const [showBody, setShowBody] = useState(false);
  const wrapperRef = useRef(null);
  const pathRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const morphCtrl = useRef(null);
  const pillResizeCtrl = useRef(null);
  const headerSquishCtrl = useRef(null);
  const morphTRef = useRef(0);
  const aDims = useRef({ pw: 0, bw: 0, th: 0 });
  const dimsRef = useRef({ pw: 0, bw: 0, th: 0 });
  const [dims, setDims] = useState({ pw: 0, bw: 0, th: 0 });
  useEffect(() => {
    dimsRef.current = dims;
  }, [dims]);
  useEffect(() => {
    return subscribeContainerHovered((h) => {
      containerHoveredRef.current = h;
      setContainerHoveredState(h);
    });
  }, []);
  const flush = useCallback(() => {
    const { pw: p, bw: b, th: h } = aDims.current;
    if (p <= 0 || b <= 0 || h <= 0) return;
    const t = Math.max(0, Math.min(1, morphTRef.current));
    const pos = getGooeyPosition();
    const d = getGooeyDir();
    const centerPos = pos?.includes("center") ?? false;
    const posRight = pos?.includes("right") ?? false;
    const rightSide = d === "rtl" ? centerPos ? false : !posRight : posRight;
    if (centerPos) {
      const centerBw = Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p);
      pathRef.current?.setAttribute("d", morphPathCenter(p, centerBw, h, t));
    } else {
      pathRef.current?.setAttribute("d", morphPath(p, b, h, t));
    }
    if (t >= 1) {
      if (wrapperRef.current) {
        wrapperRef.current.style.width = "";
      }
      if (contentRef.current) {
        contentRef.current.style.width = "";
        contentRef.current.style.overflow = "";
        contentRef.current.style.maxHeight = "";
        contentRef.current.style.clipPath = "";
      }
    } else if (t > 0) {
      const targetBw = dimsRef.current.bw;
      const targetTh = dimsRef.current.th;
      const pillW = Math.min(p, b);
      const currentW = pillW + (b - pillW) * t;
      const currentH = PH + (targetTh - PH) * t;
      const centerFullW = centerPos ? Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p) : 0;
      if (wrapperRef.current) {
        wrapperRef.current.style.width = (centerPos ? centerFullW : currentW) + "px";
      }
      if (contentRef.current) {
        contentRef.current.style.width = (centerPos ? centerFullW : targetBw) + "px";
        contentRef.current.style.overflow = "hidden";
        contentRef.current.style.maxHeight = currentH + "px";
        if (centerPos) {
          const clip = (centerFullW - currentW) / 2;
          contentRef.current.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`;
        } else {
          const clip = targetBw - currentW;
          contentRef.current.style.clipPath = rightSide ? `inset(0 0 0 ${clip}px)` : `inset(0 ${clip}px 0 0)`;
        }
      }
    } else {
      const pillW = Math.min(p, b);
      if (wrapperRef.current) {
        const centerBw = centerPos ? Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p) : pillW;
        wrapperRef.current.style.width = centerBw + "px";
      }
      if (contentRef.current) {
        if (centerPos) {
          const centerBwVal = Math.max(dimsRef.current.bw, expandedDimsRef.current.bw, p);
          contentRef.current.style.width = centerBwVal + "px";
          const clip = (centerBwVal - pillW) / 2;
          contentRef.current.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`;
        } else {
          contentRef.current.style.width = "";
          contentRef.current.style.clipPath = "";
        }
        contentRef.current.style.overflow = "hidden";
        contentRef.current.style.maxHeight = PH + "px";
      }
    }
  }, []);
  const measure = useCallback(() => {
    if (!headerRef.current || !contentRef.current) return;
    const wr = wrapperRef.current;
    const savedW = wr?.style.width ?? "";
    const savedOv = contentRef.current.style.overflow;
    const savedMH = contentRef.current.style.maxHeight;
    const savedCW = contentRef.current.style.width;
    if (wr) {
      wr.style.width = "";
    }
    contentRef.current.style.overflow = "";
    contentRef.current.style.maxHeight = "";
    contentRef.current.style.width = "";
    const cs = getComputedStyle(contentRef.current);
    const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const pw2 = headerRef.current.offsetWidth + paddingX;
    const bw2 = contentRef.current.offsetWidth;
    const th2 = contentRef.current.offsetHeight;
    if (wr) {
      wr.style.width = savedW;
    }
    contentRef.current.style.overflow = savedOv;
    contentRef.current.style.maxHeight = savedMH;
    contentRef.current.style.width = savedCW;
    dimsRef.current = { pw: pw2, bw: bw2, th: th2 };
    setDims({ pw: pw2, bw: bw2, th: th2 });
  }, []);
  useIsomorphicLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 100);
    return () => clearTimeout(t);
  }, [effectiveTitle, effectivePhase, isExpanded, showBody, effectiveDescription, effectiveAction, measure]);
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [measure]);
  const { pw, bw, th } = dims;
  const hasDims = pw > 0 && bw > 0 && th > 0;
  const blobSquishCtrl = useRef(null);
  const expandDur = DEFAULT_EXPAND_DUR;
  const collapseDur = DEFAULT_COLLAPSE_DUR;
  const lastSquishTime = useRef(0);
  const triggerLandingSquish = useCallback((phase2 = "mount") => {
    if (!wrapperRef.current || prefersReducedMotion) return;
    if (!useSpring) return;
    const now = Date.now();
    if (now - lastSquishTime.current < 300) return;
    lastSquishTime.current = now;
    blobSquishCtrl.current?.stop();
    const el = wrapperRef.current;
    const springConfig = phase2 === "collapse" ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal) : squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal);
    const bScale = bounceVal / 0.4;
    const compressY = (phase2 === "collapse" ? 0.035 : 0.12) * bScale;
    const expandX = (phase2 === "collapse" ? 0.018 : 0.06) * bScale;
    blobSquishCtrl.current = animate(0, 1, {
      ...springConfig,
      onUpdate: (v) => {
        const intensity = Math.sin(v * Math.PI);
        const sy = 1 - compressY * intensity;
        const sx = 1 + expandX * intensity;
        const mirror = el.style.transform?.includes("scaleX(-1)") ? "scaleX(-1) " : "";
        el.style.transformOrigin = "center top";
        el.style.transform = mirror + `scaleX(${sx}) scaleY(${sy})`;
      },
      onComplete: () => {
        const right = el.style.transform?.includes("scaleX(-1)");
        el.style.transform = right ? "scaleX(-1)" : "";
        el.style.transformOrigin = "";
      }
    });
  }, [prefersReducedMotion, expandDur, collapseDur, useSpring, bounceVal]);
  useIsomorphicLayoutEffect(() => {
    if (!hasDims || collapsingRef.current) return;
    const prev = { ...aDims.current };
    const target = { pw, bw, th };
    if (prev.bw <= 0) {
      aDims.current = target;
      flush();
      return;
    }
    if (morphTRef.current > 0 && morphTRef.current < 1) {
      aDims.current = target;
      flush();
      return;
    }
    if (showBody) {
      aDims.current = target;
      flush();
      return;
    }
    if (prev.bw === target.bw && prev.pw === target.pw && prev.th === target.th) return;
    if (prefersReducedMotion) {
      aDims.current = target;
      flush();
      return;
    }
    pillResizeCtrl.current?.stop();
    if (Date.now() - collapseEndTime.current > 500 && !isExpanded) {
      triggerLandingSquish("expand");
    }
    const pillResizeTransition = useSpring ? { type: "spring", duration: 0.5, bounce: bounceVal * 0.875 } : { duration: 0.4, ease: SMOOTH_EASE };
    pillResizeCtrl.current = animate(0, 1, {
      ...pillResizeTransition,
      onUpdate: (t) => {
        aDims.current = {
          pw: prev.pw + (target.pw - prev.pw) * t,
          bw: prev.bw + (target.bw - prev.bw) * t,
          th: prev.th + (target.th - prev.th) * t
        };
        flush();
      }
    });
  }, [pw, bw, th, hasDims, showBody, flush, prefersReducedMotion, triggerLandingSquish, useSpring]);
  const squishDelayMs = 45;
  const mountSquished = useRef(false);
  useEffect(() => {
    if (hasDims && !mountSquished.current && !isExpanded) {
      mountSquished.current = true;
      const t = setTimeout(triggerLandingSquish, squishDelayMs);
      return () => clearTimeout(t);
    }
  }, [hasDims, squishDelayMs, triggerLandingSquish]);
  const prevShowBody = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (!prevShowBody.current && showBody && !hoveredRef.current) {
      const t = setTimeout(() => triggerLandingSquish("expand"), 80);
      return () => clearTimeout(t);
    }
    prevShowBody.current = showBody;
  }, [showBody, triggerLandingSquish]);
  const shakeCtrl = useRef(null);
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (phase === "error" && prevPhase.current !== "error" && !dismissing && wrapperRef.current && !prefersReducedMotion) {
      shakeCtrl.current?.stop();
      const el = wrapperRef.current;
      const mirror = el.style.transform?.includes("scaleX(-1)") ? "scaleX(-1) " : "";
      shakeCtrl.current = animate(0, 1, {
        duration: 0.4,
        ease: "easeOut",
        onUpdate: (v) => {
          const decay = 1 - v;
          const shake = Math.sin(v * Math.PI * 6) * decay * 3;
          el.style.transform = mirror + `translateX(${shake}px)`;
        },
        onComplete: () => {
          el.style.transform = mirror.trim() || "";
        }
      });
    }
    prevPhase.current = phase;
    return () => {
      shakeCtrl.current?.stop();
    };
  }, [phase, dismissing, prefersReducedMotion]);
  useEffect(() => {
    if (isExpanded) {
      const delay = prefersReducedMotion ? 0 : 330;
      const t1 = setTimeout(() => setShowBody(true), delay);
      return () => clearTimeout(t1);
    }
    morphCtrl.current?.stop();
    pillResizeCtrl.current?.stop();
    if (morphTRef.current > 0) {
      const csPad = contentRef.current ? getComputedStyle(contentRef.current) : null;
      const padX = csPad ? parseFloat(csPad.paddingLeft) + parseFloat(csPad.paddingRight) : 20;
      const targetPw = headerRef.current ? headerRef.current.offsetWidth + padX : aDims.current.pw;
      const targetDims = { pw: targetPw, bw: targetPw, th: PH };
      if (prefersReducedMotion) {
        morphTRef.current = 0;
        collapsingRef.current = false;
        preDismissRef.current = false;
        setShowBody(false);
        aDims.current = { ...targetDims };
        flush();
        return;
      }
      const savedDims = expandedDimsRef.current.bw > 0 ? { ...expandedDimsRef.current } : { ...aDims.current };
      const isPreDismiss = preDismissRef.current;
      const collapseDur2 = 0.9;
      const collapseTransition = isPreDismiss || !useSpring ? { duration: collapseDur2, ease: SMOOTH_EASE } : { type: "spring", duration: collapseDur2, bounce: bounceVal * 0.875 };
      triggerLandingSquish("collapse");
      morphCtrl.current = animate(morphTRef.current, 0, {
        ...collapseTransition,
        onUpdate: (t) => {
          morphTRef.current = t;
          aDims.current = {
            pw: targetDims.pw + (savedDims.pw - targetDims.pw) * t,
            bw: targetDims.bw + (savedDims.bw - targetDims.bw) * t,
            th: targetDims.th + (savedDims.th - targetDims.th) * t
          };
          flush();
          syncSonnerHeights(wrapperRef.current, true);
        },
        onComplete: () => {
          morphTRef.current = 0;
          collapsingRef.current = false;
          preDismissRef.current = false;
          collapseEndTime.current = Date.now();
          aDims.current = { ...targetDims };
          flush();
          syncSonnerHeights(wrapperRef.current, true);
          setShowBody(false);
        }
      });
      return () => {
        morphCtrl.current?.stop();
      };
    }
    setShowBody(false);
    morphTRef.current = 0;
    flush();
  }, [isExpanded, flush, prefersReducedMotion, useSpring, triggerLandingSquish]);
  const remainingRef = useRef(null);
  const timerStartRef = useRef(0);
  const progressDelayRef = useRef(0);
  useEffect(() => {
    if (!showBody || actionSuccess || dismissing) return;
    const expandDelayMs = prefersReducedMotion ? 0 : 330;
    const collapseMs = prefersReducedMotion ? 10 : 0.9 * 1e3;
    const displayMs = timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION;
    const fullDelay = displayMs - expandDelayMs - collapseMs;
    progressDelayRef.current = Math.max(fullDelay, 0);
    if (fullDelay <= 0) return;
    if (hoveredRef.current || containerHoveredRef.current) return;
    const delay = remainingRef.current ?? fullDelay;
    timerStartRef.current = Date.now();
    const timer = setTimeout(() => {
      if (hoveredRef.current || containerHoveredRef.current) {
        const elapsed = Date.now() - timerStartRef.current;
        remainingRef.current = Math.max(0, delay - elapsed);
        return;
      }
      remainingRef.current = null;
      expandedDimsRef.current = { ...aDims.current };
      collapsingRef.current = true;
      preDismissRef.current = true;
      setDismissing(true);
    }, delay);
    dismissTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      const elapsed = Date.now() - timerStartRef.current;
      const remaining = delay - elapsed;
      if (remaining > 0 && (hoveredRef.current || containerHoveredRef.current)) {
        remainingRef.current = remaining;
      }
    };
  }, [showBody, actionSuccess, dismissing, prefersReducedMotion, hovered, containerHovered]);
  const canExpand = hasDescription || hasAction;
  const reExpandingRef = useRef(false);
  useEffect(() => {
    if (!hovered && !containerHovered || !canExpand || !dismissing) return;
    morphCtrl.current?.stop();
    collapsingRef.current = false;
    preDismissRef.current = false;
    remainingRef.current = null;
    reExpandingRef.current = true;
    setDismissing(false);
    setShowBody(true);
    if (showProgress) setProgressKey((k) => k + 1);
    const currentT = morphTRef.current;
    const startDims = { ...aDims.current };
    const morphExpandTransition = useSpring ? { type: "spring", duration: 0.9, bounce: bounceVal } : { duration: 0.6, ease: SMOOTH_EASE };
    requestAnimationFrame(() => {
      morphCtrl.current = animate(currentT, 1, {
        ...morphExpandTransition,
        onUpdate: (t) => {
          morphTRef.current = t;
          const target = dimsRef.current;
          aDims.current = {
            pw: startDims.pw + (target.pw - startDims.pw) * t,
            bw: startDims.bw + (target.bw - startDims.bw) * t,
            th: startDims.th + (target.th - startDims.th) * t
          };
          flush();
          syncSonnerHeights(wrapperRef.current, true);
        },
        onComplete: () => {
          morphTRef.current = 1;
          aDims.current = { ...dimsRef.current };
          reExpandingRef.current = false;
          flush();
          syncSonnerHeights(wrapperRef.current, true);
        }
      });
    });
    return () => {
      morphCtrl.current?.stop();
    };
  }, [hovered, containerHovered, dismissing, canExpand]);
  useEffect(() => {
    if (!toastId || !dismissing || showBody) return;
    const t = setTimeout(() => {
      if (!hoveredRef.current && !containerHoveredRef.current) {
        toast.dismiss(toastId);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [dismissing, showBody, toastId]);
  useEffect(() => {
    if (!toastId || !actionSuccess || showBody) return;
    const t = setTimeout(() => toast.dismiss(toastId), 1200);
    return () => clearTimeout(t);
  }, [toastId, actionSuccess, showBody]);
  useEffect(() => {
    if (reExpandingRef.current) return;
    if (!showBody) {
      morphTRef.current = 0;
      morphCtrl.current?.stop();
      flush();
      return;
    }
    if (prefersReducedMotion) {
      pillResizeCtrl.current?.stop();
      morphCtrl.current?.stop();
      morphTRef.current = 1;
      aDims.current = { ...dimsRef.current };
      flush();
      syncSonnerHeights(wrapperRef.current, true);
      return;
    }
    const raf = requestAnimationFrame(() => {
      pillResizeCtrl.current?.stop();
      morphCtrl.current?.stop();
      const startDims = { ...aDims.current };
      const morphExpandTransition = useSpring ? { type: "spring", duration: 0.9, bounce: bounceVal } : { duration: 0.6, ease: SMOOTH_EASE };
      morphCtrl.current = animate(0, 1, {
        ...morphExpandTransition,
        onUpdate: (t) => {
          morphTRef.current = t;
          const target = dimsRef.current;
          aDims.current = {
            pw: startDims.pw + (target.pw - startDims.pw) * t,
            bw: startDims.bw + (target.bw - startDims.bw) * t,
            th: startDims.th + (target.th - startDims.th) * t
          };
          flush();
          syncSonnerHeights(wrapperRef.current, true);
        },
        onComplete: () => {
          morphTRef.current = 1;
          aDims.current = { ...dimsRef.current };
          flush();
          syncSonnerHeights(wrapperRef.current, true);
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      morphCtrl.current?.stop();
    };
  }, [showBody, flush, prefersReducedMotion, useSpring]);
  const headerSquished = useRef(false);
  useEffect(() => {
    if (!headerRef.current || prefersReducedMotion) return;
    headerSquishCtrl.current?.stop();
    const el = headerRef.current;
    if (showBody && !dismissing && !actionSuccess) {
      if (!useSpring) return;
      headerSquished.current = true;
      headerSquishCtrl.current = animate(0, 1, {
        ...squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal),
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v;
          const pushY = v * 1;
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`;
        }
      });
    } else if (headerSquished.current) {
      headerSquished.current = false;
      const isSpringCollapse = !preDismissRef.current && useSpring;
      const transition = isSpringCollapse ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal) : { duration: collapseDur * 0.5, ease: SMOOTH_EASE };
      headerSquishCtrl.current = animate(1, 0, {
        ...transition,
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v;
          const pushY = v * 1;
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`;
        },
        onComplete: () => {
          el.style.transform = "";
        }
      });
    }
    return () => {
      headerSquishCtrl.current?.stop();
    };
  }, [showBody, dismissing, actionSuccess, prefersReducedMotion, expandDur, collapseDur, useSpring]);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ol = wrapper.closest("[data-sonner-toast]")?.parentElement;
    if (!ol) return;
    const unregister = registerSonnerObserver(ol, () => {
      syncSonnerHeights(wrapper, true);
    });
    const expandObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-expanded" && m.target.getAttribute("data-expanded") === "true") {
          syncSonnerHeights(wrapper, true);
          break;
        }
      }
    });
    expandObs.observe(ol, {
      attributes: true,
      attributeFilter: ["data-expanded"],
      subtree: true
    });
    return () => {
      unregister();
      expandObs.disconnect();
    };
  }, []);
  const handleActionClick = useCallback(() => {
    if (!effectiveAction) return;
    if (effectiveAction.successLabel) {
      expandedDimsRef.current = { ...aDims.current };
      collapsingRef.current = true;
      setActionSuccess(effectiveAction.successLabel);
    }
    try {
      effectiveAction.onClick();
    } catch {
    }
  }, [effectiveAction]);
  const SWIPE_THRESHOLD = 100;
  const swipeStartRef = useRef(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const isSwipingRef = useRef(false);
  const handleTouchStart = useCallback((e) => {
    if (!getGooeySwipeToDismiss()) return;
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    isSwipingRef.current = false;
  }, []);
  const handleTouchMove = useCallback((e) => {
    if (!swipeStartRef.current || !getGooeySwipeToDismiss()) return;
    const touch = e.touches[0];
    const dx = touch.clientX - swipeStartRef.current.x;
    const dy = touch.clientY - swipeStartRef.current.y;
    if (!isSwipingRef.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      swipeStartRef.current = null;
      return;
    }
    if (!isSwipingRef.current && Math.abs(dx) > 10) {
      isSwipingRef.current = true;
    }
    if (isSwipingRef.current) {
      setSwipeOffsetX(dx);
    }
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (!getGooeySwipeToDismiss()) {
      swipeStartRef.current = null;
      return;
    }
    if (isSwipingRef.current && Math.abs(swipeOffsetX) >= SWIPE_THRESHOLD && toastId) {
      toast.dismiss(toastId);
    }
    swipeStartRef.current = null;
    isSwipingRef.current = false;
    setSwipeOffsetX(0);
  }, [swipeOffsetX, toastId]);
  const swipeOpacity = swipeOffsetX !== 0 ? Math.max(0, 1 - Math.abs(swipeOffsetX) / (SWIPE_THRESHOLD * 1.5)) : 1;
  const swipeTranslate = swipeOffsetX !== 0 ? `translateX(${swipeOffsetX}px)` : "";
  const renderIcon = () => {
    if (!actionSuccess && icon) return icon;
    if (isLoading) return /* @__PURE__ */ jsx(SpinnerIcon, { size: 18, className: styles.spinnerSpin });
    const IconComponent = phaseIconMap[effectivePhase];
    return /* @__PURE__ */ jsx(IconComponent, { size: 18 });
  };
  const iconTransition = useMemo(
    () => prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 },
    [prefersReducedMotion]
  );
  const iconEl = /* @__PURE__ */ jsx("div", { className: `${styles.iconWrapper}${classNames?.icon ? ` ${classNames.icon}` : ""}`, children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: prefersReducedMotion ? false : { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.5 },
      transition: iconTransition,
      children: renderIcon()
    },
    isLoading ? "spinner" : effectivePhase
  ) }) });
  const titleEl = /* @__PURE__ */ jsx("span", { className: `${styles.title}${classNames?.title ? ` ${classNames.title}` : ""}`, children: effectiveTitle });
  const createdAtRef = useRef(/* @__PURE__ */ new Date());
  const timestampStr = useMemo(
    () => createdAtRef.current.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit", second: "2-digit" }),
    []
  );
  const iconAndTitle = /* @__PURE__ */ jsxs(Fragment, { children: [
    iconEl,
    titleEl
  ] });
  const basePositionStyle = useMemo(
    () => isCenter ? { margin: "0 auto" } : isRight ? { marginLeft: "auto", transform: "scaleX(-1)" } : {},
    [isCenter, isRight]
  );
  const wrapperStyle = useMemo(() => {
    if (swipeTranslate) {
      return {
        ...basePositionStyle,
        transform: (basePositionStyle.transform ? basePositionStyle.transform + " " : "") + swipeTranslate,
        opacity: swipeOpacity,
        transition: "none"
      };
    }
    return Object.keys(basePositionStyle).length > 0 ? basePositionStyle : void 0;
  }, [basePositionStyle, swipeTranslate, swipeOpacity]);
  const contentStyle = useMemo(
    () => isCenter ? { textAlign: "center" } : isRight ? { transform: "scaleX(-1)", textAlign: "right" } : { textAlign: "left" },
    [isCenter, isRight]
  );
  const handleMouseEnter = useCallback(() => {
    hoveredRef.current = true;
    setHovered(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = false;
    setHovered(false);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref: wrapperRef, className: `${styles.wrapper}${classNames?.wrapper ? ` ${classNames.wrapper}` : ""}`, style: wrapperStyle, role: effectivePhase === "error" || effectivePhase === "warning" ? "alert" : "status", "aria-live": effectivePhase === "error" || effectivePhase === "warning" ? "assertive" : "polite", "aria-atomic": "true", onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd, "data-center": isCenter || void 0, "data-theme": theme, children: [
    /* @__PURE__ */ jsx(
      "svg",
      {
        className: styles.blobSvg,
        "aria-hidden": true,
        children: /* @__PURE__ */ jsx(
          "path",
          {
            ref: pathRef,
            fill: fillColor,
            stroke: borderColor || "none",
            strokeWidth: borderColor ? borderWidth ?? 1.5 : 0
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: contentRef,
        className: `${styles.content} ${showBody ? styles.contentExpanded : styles.contentCompact}${classNames?.content ? ` ${classNames.content}` : ""}`,
        style: contentStyle,
        children: [
          /* @__PURE__ */ jsxs("div", { ref: headerRef, className: `${styles.header} ${titleColorMap[effectivePhase]}${classNames?.header ? ` ${classNames.header}` : ""}`, children: [
            iconAndTitle,
            !hasDescription && !hasAction && !actionSuccess && /* @__PURE__ */ jsx("span", { className: styles.timestamp, children: timestampStr })
          ] }),
          /* @__PURE__ */ jsx(AnimatePresence, { children: showBody && hasDescription && !dismissing && /* @__PURE__ */ jsxs(
            motion.div,
            {
              className: `${styles.description}${classNames?.description ? ` ${classNames.description}` : ""}`,
              style: { textAlign: "left" },
              initial: prefersReducedMotion ? false : { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              children: [
                /* @__PURE__ */ jsx("span", { className: styles.timestamp, style: { float: "right", marginLeft: 10, marginTop: 3, paddingLeft: 0 }, children: timestampStr }),
                effectiveDescription
              ]
            },
            "description"
          ) }),
          /* @__PURE__ */ jsx(AnimatePresence, { children: showBody && !hasDescription && hasAction && !dismissing && /* @__PURE__ */ jsx(
            motion.div,
            {
              className: styles.timestamp,
              style: { textAlign: "right", marginTop: 8, paddingLeft: 0 },
              initial: prefersReducedMotion ? false : { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              children: timestampStr
            },
            "timestamp-body"
          ) }),
          /* @__PURE__ */ jsx(AnimatePresence, { children: showBody && hasAction && effectiveAction && !dismissing && /* @__PURE__ */ jsx(
            motion.div,
            {
              className: `${styles.actionWrapper}${classNames?.actionWrapper ? ` ${classNames.actionWrapper}` : ""}`,
              initial: prefersReducedMotion ? false : { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.1 },
              children: /* @__PURE__ */ jsx(
                "button",
                {
                  className: `${styles.actionButton} ${actionColorMap[effectivePhase]}${classNames?.actionButton ? ` ${classNames.actionButton}` : ""}`,
                  onClick: handleActionClick,
                  type: "button",
                  "aria-label": effectiveAction.label,
                  children: effectiveAction.label
                }
              )
            },
            "action"
          ) }),
          showProgress && /* @__PURE__ */ jsx(
            "div",
            {
              className: `${styles.progressWrapper}${hovered || containerHovered ? ` ${styles.progressPaused}` : ""}`,
              style: { opacity: showBody && !actionSuccess ? 1 : 0 },
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `${styles.progressBar} ${progressColorMap[effectivePhase]}`,
                  style: { "--gooey-progress-duration": `${progressDelayRef.current || (timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION)}ms` }
                }
              )
            },
            progressKey
          )
        ]
      }
    )
  ] });
};
var ToastErrorBoundary = class extends Component {
  constructor() {
    super(...arguments);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GooeyToast] Rendering error:", error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
};
var DEFAULT_EXPANDED_DURATION = 4e3;
function getAnnouncePoliteness(type) {
  return type === "error" || type === "warning" ? "assertive" : "polite";
}
function buildAnnouncementMessage(title, description) {
  if (!description || typeof description !== "string") return title;
  return `${title}: ${description}`;
}
var _activeIds = /* @__PURE__ */ new Map();
var _queue = [];
var _toastCallbacks = /* @__PURE__ */ new Map();
var _autoCloseFlags = /* @__PURE__ */ new Set();
var _manualDismissFlags = /* @__PURE__ */ new Set();
function _getMostRecentActiveId() {
  let last;
  for (const id of _activeIds.keys()) last = id;
  return last;
}
function _processQueue() {
  const max = getGooeyVisibleToasts();
  while (_queue.length > 0 && _activeIds.size < max) {
    const next = _queue.shift();
    _activeIds.set(next.id, next.type);
    next.create();
  }
}
function _enqueue(entry) {
  const maxQueue = getGooeyMaxQueue();
  const overflow = getGooeyQueueOverflow();
  if (_queue.length >= maxQueue) {
    if (overflow === "drop-newest") return false;
    _queue.shift();
  }
  _queue.push(entry);
  return true;
}
function _onToastDismissed(id) {
  if (!_activeIds.delete(id)) return;
  _toastUpdateListeners.delete(id);
  const cbs = _toastCallbacks.get(id);
  if (cbs) {
    const isAutoClose = _autoCloseFlags.has(id) || !_manualDismissFlags.has(id);
    if (isAutoClose && cbs.onAutoClose) {
      try {
        cbs.onAutoClose(id);
      } catch {
      }
    }
    if (cbs.onDismiss) {
      try {
        cbs.onDismiss(id);
      } catch {
      }
    }
    _toastCallbacks.delete(id);
  }
  _autoCloseFlags.delete(id);
  _manualDismissFlags.delete(id);
  _processQueue();
}
var _toastUpdateListeners = /* @__PURE__ */ new Map();
function updateGooeyToast(id, options) {
  const listener = _toastUpdateListeners.get(id);
  if (listener) {
    listener(options);
    if (options.type !== void 0 && _activeIds.has(id)) {
      _activeIds.set(id, options.type);
    }
    if (options.title !== void 0) {
      announce(
        buildAnnouncementMessage(options.title, options.description),
        options.type ? getAnnouncePoliteness(options.type) : "polite"
      );
    }
  }
}
function GooeyToastWrapper({
  initialPhase,
  title: initialTitle,
  type: initialType,
  description: initialDescription,
  action: initialAction,
  icon,
  classNames,
  fillColor,
  borderColor,
  borderWidth,
  timing,
  preset,
  spring,
  bounce,
  showProgress,
  toastId,
  activeId,
  onDismiss,
  onAutoClose
}) {
  useEffect(() => {
    if (onDismiss || onAutoClose) {
      _toastCallbacks.set(activeId, { onDismiss, onAutoClose });
    }
  }, [activeId, onDismiss, onAutoClose]);
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState(initialType);
  const [phase, setPhase] = useState(initialPhase);
  const [description, setDescription] = useState(initialDescription);
  const [action, setAction] = useState(initialAction);
  const [currentIcon, setCurrentIcon] = useState(icon);
  useEffect(() => {
    const handleUpdate = (opts) => {
      if (opts.title !== void 0) setTitle(opts.title);
      if (opts.description !== void 0) setDescription(opts.description);
      if (opts.type !== void 0) {
        setType(opts.type);
        setPhase(opts.type);
      }
      if (opts.action !== void 0) setAction(opts.action);
      if ("icon" in opts) setCurrentIcon(opts.icon ?? void 0);
    };
    _toastUpdateListeners.set(activeId, handleUpdate);
    return () => {
      _toastUpdateListeners.delete(activeId);
    };
  }, [activeId]);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(activeId);
      }, 100);
    };
  }, [activeId]);
  return /* @__PURE__ */ jsx(ToastErrorBoundary, { children: /* @__PURE__ */ jsx(
    GooeyToast,
    {
      title,
      description,
      type,
      action,
      icon: currentIcon,
      phase,
      classNames,
      fillColor,
      borderColor,
      borderWidth,
      timing,
      preset,
      spring,
      bounce,
      showProgress,
      toastId
    }
  ) });
}
function PromiseToastWrapper({
  promise,
  data,
  toastId
}) {
  const [phase, setPhase] = useState("loading");
  const [title, setTitle] = useState(data.loading);
  const [description, setDescription] = useState(data.description?.loading);
  const [action, setAction] = useState(void 0);
  useEffect(() => {
    if (data.onDismiss || data.onAutoClose) {
      _toastCallbacks.set(toastId, { onDismiss: data.onDismiss, onAutoClose: data.onAutoClose });
    }
  }, [toastId, data.onDismiss, data.onAutoClose]);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(toastId);
      }, 100);
    };
  }, [toastId]);
  useEffect(() => {
    const resetDuration = (hasExpandedContent) => {
      const baseDuration = data.timing?.displayDuration ?? (hasExpandedContent ? DEFAULT_EXPANDED_DURATION : void 0);
      const collapseDurMs = 0.9 * 1e3;
      const duration = baseDuration != null && hasExpandedContent ? baseDuration + collapseDurMs : baseDuration;
      if (duration != null) {
        toast.custom(() => /* @__PURE__ */ jsx(PromiseToastWrapper, { promise, data, toastId }), { id: toastId, duration });
      }
    };
    promise.then((result) => {
      const desc = typeof data.description?.success === "function" ? data.description.success(result) : data.description?.success;
      const resolvedTitle = typeof data.success === "function" ? data.success(result) : data.success;
      setTitle(resolvedTitle);
      setDescription(desc);
      setAction(data.action?.success);
      setPhase("success");
      resetDuration(Boolean(desc || data.action?.success));
      announce(buildAnnouncementMessage(resolvedTitle, desc), "polite");
    }).catch((err) => {
      const desc = typeof data.description?.error === "function" ? data.description.error(err) : data.description?.error;
      const resolvedTitle = typeof data.error === "function" ? data.error(err) : data.error;
      setTitle(resolvedTitle);
      setDescription(desc);
      setAction(data.action?.error);
      setPhase("error");
      resetDuration(Boolean(desc || data.action?.error));
      announce(buildAnnouncementMessage(resolvedTitle, desc), "assertive");
    });
  }, []);
  return /* @__PURE__ */ jsx(ToastErrorBoundary, { children: /* @__PURE__ */ jsx(
    GooeyToast,
    {
      title,
      description,
      type: phase === "loading" ? "info" : phase,
      action,
      phase,
      classNames: data.classNames,
      fillColor: data.fillColor,
      borderColor: data.borderColor,
      borderWidth: data.borderWidth,
      timing: data.timing,
      preset: data.preset,
      spring: data.spring,
      bounce: data.bounce
    }
  ) });
}
function createGooeyToast(title, type, options) {
  const hasExpandedContent = Boolean(options?.description || options?.action);
  const baseDuration = options?.timing?.displayDuration ?? options?.duration ?? (options?.description ? DEFAULT_EXPANDED_DURATION : void 0);
  const duration = hasExpandedContent ? Infinity : baseDuration;
  const toastId = options?.id ?? Math.random().toString(36).slice(2);
  const create = () => {
    toast.custom(
      () => /* @__PURE__ */ jsx(
        GooeyToastWrapper,
        {
          initialPhase: type,
          title,
          type,
          description: options?.description,
          action: options?.action,
          icon: options?.icon,
          classNames: options?.classNames,
          fillColor: options?.fillColor,
          borderColor: options?.borderColor,
          borderWidth: options?.borderWidth,
          timing: options?.timing,
          preset: options?.preset,
          spring: options?.spring,
          bounce: options?.bounce,
          showProgress: options?.showProgress,
          toastId: hasExpandedContent ? toastId : void 0,
          activeId: toastId,
          onDismiss: options?.onDismiss,
          onAutoClose: options?.onAutoClose
        }
      ),
      {
        duration,
        id: toastId
      }
    );
  };
  if (options?.onDismiss || options?.onAutoClose) {
    _toastCallbacks.set(toastId, { onDismiss: options.onDismiss, onAutoClose: options.onAutoClose });
  }
  announce(
    buildAnnouncementMessage(title, options?.description),
    getAnnouncePoliteness(type)
  );
  if (_activeIds.size < getGooeyVisibleToasts()) {
    _activeIds.set(toastId, type);
    create();
  } else {
    _enqueue({ id: toastId, type, create });
  }
  return toastId;
}
function dismissGooeyToast(idOrFilter) {
  if (idOrFilter != null && typeof idOrFilter === "object") {
    const filterTypes = Array.isArray(idOrFilter.type) ? idOrFilter.type : [idOrFilter.type];
    const typesSet = new Set(filterTypes);
    for (let i = _queue.length - 1; i >= 0; i--) {
      if (typesSet.has(_queue[i].type)) {
        _queue.splice(i, 1);
      }
    }
    for (const [id, toastType] of _activeIds) {
      if (typesSet.has(toastType)) {
        _manualDismissFlags.add(id);
        toast.dismiss(id);
      }
    }
  } else if (idOrFilter != null) {
    const idx = _queue.findIndex((q) => q.id === idOrFilter);
    if (idx !== -1) {
      _queue.splice(idx, 1);
      return;
    }
    _manualDismissFlags.add(idOrFilter);
    toast.dismiss(idOrFilter);
  } else {
    for (const id of _activeIds.keys()) {
      _manualDismissFlags.add(id);
    }
    _queue.length = 0;
    _activeIds.clear();
    toast.dismiss();
  }
}
var gooeyToast = Object.assign(
  (title, options) => createGooeyToast(title, "default", options),
  {
    success: (title, options) => createGooeyToast(title, "success", options),
    error: (title, options) => createGooeyToast(title, "error", options),
    warning: (title, options) => createGooeyToast(title, "warning", options),
    info: (title, options) => createGooeyToast(title, "info", options),
    promise: (promise, data) => {
      const id = Math.random().toString(36).slice(2);
      announce(buildAnnouncementMessage(data.loading, data.description?.loading), "polite");
      if (data.onDismiss || data.onAutoClose) {
        _toastCallbacks.set(id, { onDismiss: data.onDismiss, onAutoClose: data.onAutoClose });
      }
      const create = () => {
        toast.custom(() => /* @__PURE__ */ jsx(PromiseToastWrapper, { promise, data, toastId: id }), {
          id,
          duration: data.timing?.displayDuration != null || data.description ? Infinity : void 0
        });
      };
      if (_activeIds.size < getGooeyVisibleToasts()) {
        _activeIds.set(id, "info");
        create();
      } else {
        _enqueue({ id, type: "info", create });
      }
      return id;
    },
    dismiss: dismissGooeyToast,
    update: updateGooeyToast
  }
);
function AriaLiveAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const handleAnnouncement = useCallback(({ message, politeness }) => {
    if (politeness === "assertive") {
      setAssertiveMessage("");
      requestAnimationFrame(() => setAssertiveMessage(message));
    } else {
      setPoliteMessage("");
      requestAnimationFrame(() => setPoliteMessage(message));
    }
  }, []);
  useEffect(() => {
    return subscribeAnnouncements(handleAnnouncement);
  }, [handleAnnouncement]);
  useEffect(() => {
    if (!politeMessage) return;
    const t = setTimeout(() => setPoliteMessage(""), 7e3);
    return () => clearTimeout(t);
  }, [politeMessage]);
  useEffect(() => {
    if (!assertiveMessage) return;
    const t = setTimeout(() => setAssertiveMessage(""), 7e3);
    return () => clearTimeout(t);
  }, [assertiveMessage]);
  const visuallyHidden = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
        style: visuallyHidden,
        children: politeMessage
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "alert",
        "aria-live": "assertive",
        "aria-atomic": "true",
        style: visuallyHidden,
        children: assertiveMessage
      }
    )
  ] });
}
function GooeyToaster({
  position = "bottom-right",
  duration,
  gap = 14,
  offset = "24px",
  theme = "light",
  toastOptions,
  expand,
  closeButton,
  richColors,
  visibleToasts,
  dir,
  preset,
  spring,
  bounce,
  swipeToDismiss = true,
  closeOnEscape = true,
  maxQueue = Infinity,
  queueOverflow = "drop-oldest",
  showProgress = false
}) {
  const presetConfig = preset ? animationPresets[preset] : void 0;
  const resolvedSpring = spring ?? presetConfig?.spring ?? true;
  const resolvedBounce = bounce ?? presetConfig?.bounce;
  useEffect(() => {
    setGooeyPosition(position);
  }, [position]);
  useEffect(() => {
    setGooeyDir(dir ?? "ltr");
  }, [dir]);
  useEffect(() => {
    setGooeyTheme(theme);
  }, [theme]);
  useEffect(() => {
    setGooeySpring(resolvedSpring);
  }, [resolvedSpring]);
  useEffect(() => {
    setGooeyBounce(resolvedBounce);
  }, [resolvedBounce]);
  useEffect(() => {
    setGooeySwipeToDismiss(swipeToDismiss);
  }, [swipeToDismiss]);
  useEffect(() => {
  }, [closeOnEscape]);
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const recentId = _getMostRecentActiveId();
        if (recentId != null) {
          gooeyToast.dismiss(recentId);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape]);
  useEffect(() => {
    setGooeyVisibleToasts(visibleToasts ?? 3);
  }, [visibleToasts]);
  useEffect(() => {
    setGooeyMaxQueue(maxQueue);
  }, [maxQueue]);
  useEffect(() => {
    setGooeyQueueOverflow(queueOverflow);
  }, [queueOverflow]);
  useEffect(() => {
    setGooeyShowProgress(showProgress);
  }, [showProgress]);
  useEffect(() => {
    let expandObs = null;
    let currentOl = null;
    const syncFromExpanded = (ol) => {
      const anyExpanded = ol.querySelector('[data-sonner-toast][data-expanded="true"]') !== null;
      setContainerHovered(anyExpanded);
    };
    const attach = (ol) => {
      if (ol === currentOl) return;
      expandObs?.disconnect();
      currentOl = ol;
      expandObs = new MutationObserver(() => syncFromExpanded(ol));
      expandObs.observe(ol, { attributes: true, attributeFilter: ["data-expanded"], subtree: true });
      syncFromExpanded(ol);
    };
    const el = document.querySelector("[data-sonner-toaster]");
    if (el) attach(el);
    let bodyRafId = 0;
    const bodyObs = new MutationObserver(() => {
      if (bodyRafId) return;
      bodyRafId = requestAnimationFrame(() => {
        bodyRafId = 0;
        const found = document.querySelector("[data-sonner-toaster]");
        if (found) {
          attach(found);
        } else if (currentOl) {
          expandObs?.disconnect();
          currentOl = null;
          setContainerHovered(false);
        }
      });
    });
    bodyObs.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (bodyRafId) cancelAnimationFrame(bodyRafId);
      bodyObs.disconnect();
      expandObs?.disconnect();
      setContainerHovered(false);
    };
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const el = document.createElement("div");
    el.setAttribute("data-gooey-toast-css", "");
    el.style.position = "absolute";
    el.style.width = "0";
    el.style.height = "0";
    el.style.overflow = "hidden";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    const value = getComputedStyle(el).getPropertyValue("--gooey-toast");
    document.body.removeChild(el);
    if (!value) {
      console.warn(
        '[gooey-toast] Styles not found. Make sure to import the CSS:\n\n  import "goey-toast/styles.css";\n'
      );
    }
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Toaster,
      {
        position,
        duration,
        gap,
        offset,
        theme,
        toastOptions: { unstyled: true, ...toastOptions },
        expand,
        closeButton,
        richColors,
        visibleToasts: 99,
        dir
      }
    ),
    /* @__PURE__ */ jsx(AriaLiveAnnouncer, {})
  ] });
}

export { GooeyToaster as GoeyToaster, GooeyToaster, animationPresets, gooeyToast as goeyToast, gooeyToast };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map