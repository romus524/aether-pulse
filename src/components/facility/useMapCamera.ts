import { useCallback, useEffect, useRef, useState } from 'react';

export interface MapCameraRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseMapCameraOptions {
  mapWidth: number;
  mapHeight: number;
  floorId: string;
  viewportRef: React.RefObject<HTMLElement | null>;
  layerRef: React.RefObject<HTMLElement | null>;
  focusRect: MapCameraRect | null;
  focusKey: string;
}

const FIT_PADDING = 28;
const MIN_ZOOM_FACTOR = 0.92;
const MAX_ZOOM_FACTOR = 3.35;
const FOCUS_ZOOM_FACTOR = 1.85;
const WHEEL_SENSITIVITY = 0.00155;
const FRICTION = 0.88;
const MIN_VELOCITY = 0.18;
const DRAG_THRESHOLD = 6;
const FOCUS_DURATION_MS = 480;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useMapCamera = ({
  mapWidth,
  mapHeight,
  floorId,
  viewportRef,
  layerRef,
  focusRect,
  focusKey,
}: UseMapCameraOptions) => {
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const fitZoomRef = useRef(1);
  const limitsRef = useRef({ min: 0.5, max: 4 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const lastMoveRef = useRef({ t: 0, x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const lodFrameRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const skipNextFocusRef = useRef(true);
  const [relativeZoom, setRelativeZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const applyTransform = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const { x, y, zoom } = cameraRef.current;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
  }, [layerRef]);

  const scheduleLodUpdate = useCallback(() => {
    if (lodFrameRef.current !== null) return;
    lodFrameRef.current = window.requestAnimationFrame(() => {
      lodFrameRef.current = null;
      const relative = cameraRef.current.zoom / Math.max(fitZoomRef.current, 0.001);
      setRelativeZoom((prev) => (Math.abs(prev - relative) < 0.03 ? prev : relative));
    });
  }, []);

  const getViewportSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return {
      width: rect?.width || 1,
      height: rect?.height || 1,
    };
  }, [viewportRef]);

  const clampCamera = useCallback(
    (x: number, y: number, zoom: number) => {
      const { width: vw, height: vh } = getViewportSize();
      const mapW = mapWidth * zoom;
      const mapH = mapHeight * zoom;
      const padX = Math.min(80, vw * 0.18);
      const padY = Math.min(80, vh * 0.18);

      let nextX = x;
      let nextY = y;

      if (mapW <= vw - padX * 0.5) {
        nextX = (vw - mapW) / 2;
      } else {
        nextX = clamp(x, vw - mapW + padX, -padX);
      }

      if (mapH <= vh - padY * 0.5) {
        nextY = (vh - mapH) / 2;
      } else {
        nextY = clamp(y, vh - mapH + padY, -padY);
      }

      return { x: nextX, y: nextY, zoom };
    },
    [getViewportSize, mapHeight, mapWidth]
  );

  const setCamera = useCallback(
    (x: number, y: number, zoom: number) => {
      const next = clampCamera(x, y, zoom);
      cameraRef.current = next;
      applyTransform();
      scheduleLodUpdate();
      return next;
    },
    [applyTransform, clampCamera, scheduleLodUpdate]
  );

  const computeFit = useCallback(() => {
    const { width: vw, height: vh } = getViewportSize();
    const availableW = Math.max(vw - FIT_PADDING * 2, 1);
    const availableH = Math.max(vh - FIT_PADDING * 2, 1);
    const zoom = Math.min(availableW / mapWidth, availableH / mapHeight);
    const x = (vw - mapWidth * zoom) / 2;
    const y = (vh - mapHeight * zoom) / 2;
    fitZoomRef.current = zoom;
    limitsRef.current = {
      min: zoom * MIN_ZOOM_FACTOR,
      max: zoom * MAX_ZOOM_FACTOR,
    };
    return { x, y, zoom };
  }, [getViewportSize, mapHeight, mapWidth]);

  const cancelInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  const cancelFocus = useCallback(() => {
    if (focusFrameRef.current !== null) {
      cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
  }, []);

  const startInertia = useCallback(() => {
    cancelInertia();
    const step = () => {
      const vel = velocityRef.current;
      vel.x *= FRICTION;
      vel.y *= FRICTION;
      if (Math.abs(vel.x) < MIN_VELOCITY && Math.abs(vel.y) < MIN_VELOCITY) {
        inertiaFrameRef.current = null;
        velocityRef.current = { x: 0, y: 0 };
        return;
      }
      const cam = cameraRef.current;
      setCamera(cam.x + vel.x, cam.y + vel.y, cam.zoom);
      inertiaFrameRef.current = requestAnimationFrame(step);
    };
    inertiaFrameRef.current = requestAnimationFrame(step);
  }, [cancelInertia, setCamera]);

  const zoomAtPoint = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cam = cameraRef.current;
      const worldX = (px - cam.x) / cam.zoom;
      const worldY = (py - cam.y) / cam.zoom;
      const nextZoom = clamp(
        cam.zoom * factor,
        limitsRef.current.min,
        limitsRef.current.max
      );
      setCamera(px - worldX * nextZoom, py - worldY * nextZoom, nextZoom);
    },
    [setCamera, viewportRef]
  );

  const animateTo = useCallback(
    (targetX: number, targetY: number, targetZoom: number) => {
      cancelFocus();
      cancelInertia();
      const start = { ...cameraRef.current };
      const clamped = clampCamera(targetX, targetY, targetZoom);
      const startedAt = performance.now();

      const step = (now: number) => {
        const t = clamp((now - startedAt) / FOCUS_DURATION_MS, 0, 1);
        const k = easeOutCubic(t);
        setCamera(
          start.x + (clamped.x - start.x) * k,
          start.y + (clamped.y - start.y) * k,
          start.zoom + (clamped.zoom - start.zoom) * k
        );
        if (t < 1) {
          focusFrameRef.current = requestAnimationFrame(step);
        } else {
          focusFrameRef.current = null;
        }
      };

      focusFrameRef.current = requestAnimationFrame(step);
    },
    [cancelFocus, cancelInertia, clampCamera, setCamera]
  );

  const focusOnRect = useCallback(
    (rect: MapCameraRect) => {
      const { width: vw, height: vh } = getViewportSize();
      const zoom = clamp(
        fitZoomRef.current * FOCUS_ZOOM_FACTOR,
        limitsRef.current.min,
        limitsRef.current.max
      );
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      animateTo(vw / 2 - cx * zoom, vh / 2 - cy * zoom, zoom);
    },
    [animateTo, getViewportSize]
  );

  const fitToView = useCallback(
    (animate = true) => {
      const fit = computeFit();
      if (animate) {
        animateTo(fit.x, fit.y, fit.zoom);
      } else {
        setCamera(fit.x, fit.y, fit.zoom);
      }
    },
    [animateTo, computeFit, setCamera]
  );

  const consumeDidDrag = useCallback(() => {
    const dragged = didDragRef.current;
    didDragRef.current = false;
    return dragged;
  }, []);

  useEffect(() => {
    skipNextFocusRef.current = false;
    const fit = computeFit();
    setCamera(fit.x, fit.y, fit.zoom);
    if (focusRect) {
      skipNextFocusRef.current = true;
      requestAnimationFrame(() => focusOnRect(focusRect));
    }
    // Only reset camera when the floor or map size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId, mapWidth, mapHeight]);

  useEffect(() => {
    if (skipNextFocusRef.current) {
      skipNextFocusRef.current = false;
      return;
    }
    if (!focusRect) return;
    focusOnRect(focusRect);
  }, [focusKey, focusRect, focusOnRect]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cancelFocus();
      cancelInertia();

      const isPinch = event.ctrlKey || event.metaKey;
      const deltaX = event.deltaX;
      const deltaY = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

      if (!isPinch && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        const cam = cameraRef.current;
        setCamera(cam.x - deltaX, cam.y - deltaY, cam.zoom);
        return;
      }

      const factor = Math.exp(-deltaY * WHEEL_SENSITIVITY);
      zoomAtPoint(event.clientX, event.clientY, factor);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-map-ui]')) return;

      didDragRef.current = false;
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      cancelFocus();

      if (pointersRef.current.size === 2) {
        const pts = [...pointersRef.current.values()];
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        pinchRef.current = {
          distance: Math.hypot(dx, dy) || 1,
          zoom: cameraRef.current.zoom,
        };
        dragRef.current = null;
        cancelInertia();
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      };
      lastMoveRef.current = {
        t: performance.now(),
        x: event.clientX,
        y: event.clientY,
      };
      velocityRef.current = { x: 0, y: 0 };
      cancelInertia();
      viewport.setPointerCapture(event.pointerId);
      setIsDragging(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const pts = [...pointersRef.current.values()];
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const distance = Math.hypot(dx, dy) || 1;
        const factor = distance / pinchRef.current.distance;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const nextZoom = clamp(
          pinchRef.current.zoom * factor,
          limitsRef.current.min,
          limitsRef.current.max
        );
        const cam = cameraRef.current;
        const currentFactor = nextZoom / cam.zoom;
        zoomAtPoint(midX, midY, currentFactor);
        didDragRef.current = true;
        return;
      }

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      didDragRef.current = true;

      const now = performance.now();
      const dt = Math.max(now - lastMoveRef.current.t, 8);
      velocityRef.current = {
        x: (event.clientX - lastMoveRef.current.x) * (16 / dt),
        y: (event.clientY - lastMoveRef.current.y) * (16 / dt),
      };
      lastMoveRef.current = { t: now, x: event.clientX, y: event.clientY };
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      const cam = cameraRef.current;
      setCamera(cam.x + dx, cam.y + dy, cam.zoom);
    };

    const endPointer = (event: PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) {
        pinchRef.current = null;
      }

      if (dragRef.current?.pointerId === event.pointerId) {
        const shouldCoast = dragRef.current.moved;
        dragRef.current = null;
        setIsDragging(false);
        if (shouldCoast) startInertia();
      }

      if (viewport.hasPointerCapture?.(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    const onDblClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest('[data-map-ui]')) return;
      const relative = cameraRef.current.zoom / fitZoomRef.current;
      if (relative > 2.2) {
        fitToView(true);
        return;
      }
      zoomAtPoint(event.clientX, event.clientY, 1.45);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Node | null;
      if (target !== viewport && (!target || !viewport.contains(target))) {
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        const { width, height } = getViewportSize();
        const rect = viewport.getBoundingClientRect();
        zoomAtPoint(rect.left + width / 2, rect.top + height / 2, 1.18);
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        const { width, height } = getViewportSize();
        const rect = viewport.getBoundingClientRect();
        zoomAtPoint(rect.left + width / 2, rect.top + height / 2, 1 / 1.18);
      }
      if (event.key === '0') {
        event.preventDefault();
        fitToView(true);
      }
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('dblclick', onDblClick);
    viewport.addEventListener('keydown', onKeyDown);

    let ignoreInitialResize = true;
    const observer = new ResizeObserver(() => {
      if (ignoreInitialResize) {
        ignoreInitialResize = false;
        return;
      }
      const relative = cameraRef.current.zoom / Math.max(fitZoomRef.current, 0.001);
      const fit = computeFit();
      const nextZoom = clamp(
        fit.zoom * relative,
        limitsRef.current.min,
        limitsRef.current.max
      );
      const size = getViewportSize();
      const cx = size.width / 2;
      const cy = size.height / 2;
      const cam = cameraRef.current;
      const worldX = (cx - cam.x) / cam.zoom;
      const worldY = (cy - cam.y) / cam.zoom;
      setCamera(cx - worldX * nextZoom, cy - worldY * nextZoom, nextZoom);
    });
    observer.observe(viewport);

    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endPointer);
      viewport.removeEventListener('pointercancel', endPointer);
      viewport.removeEventListener('dblclick', onDblClick);
      viewport.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      cancelInertia();
      cancelFocus();
      if (lodFrameRef.current !== null) cancelAnimationFrame(lodFrameRef.current);
    };
  }, [
    cancelFocus,
    cancelInertia,
    computeFit,
    fitToView,
    getViewportSize,
    setCamera,
    startInertia,
    viewportRef,
    zoomAtPoint,
  ]);

  return {
    relativeZoom,
    isDragging,
    consumeDidDrag,
  };
};
