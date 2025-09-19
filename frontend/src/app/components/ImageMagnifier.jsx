"use client";

import React from "react";

export default function ImageMagnifier({
  src,
  alt = "",
  className = "",
  lensSize = 140,
  zoomScale = 2.5,
  previewWidth = 320,
  previewHeight = 320,
  showPreview = true,
  onError,
}) {
  const containerRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const [show, setShow] = React.useState(false);
  const [lensPos, setLensPos] = React.useState({ x: 0, y: 0 }); // top-left
  const [displayDims, setDisplayDims] = React.useState({ cw: 0, ch: 0, dw: 0, dh: 0, ox: 0, oy: 0 });

  const computeDisplay = React.useCallback(() => {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const cRect = c.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();
    const cw = cRect.width;
    const ch = cRect.height || iRect.height; // fallback to image if container has no explicit height
    const dw = iRect.width;
    const dh = iRect.height;
    const ox = iRect.left - cRect.left;
    const oy = iRect.top - cRect.top;
    setDisplayDims({ cw, ch, dw, dh, ox, oy });
  }, []);

  React.useEffect(() => {
    computeDisplay();
    window.addEventListener("resize", computeDisplay);
    return () => window.removeEventListener("resize", computeDisplay);
  }, [computeDisplay]);

  const moveLens = React.useCallback((clientX, clientY) => {
    const c = containerRef.current;
    if (!c) return;
    const { left, top } = c.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const { ox, oy, dw, dh } = displayDims;

    // Clamp lens to the displayed image area (not the whole container)
    let lx = x - lensSize / 2;
    let ly = y - lensSize / 2;
    const minX = ox;
    const minY = oy;
    const maxX = ox + dw - lensSize;
    const maxY = oy + dh - lensSize;
    lx = Math.max(minX, Math.min(lx, maxX));
    ly = Math.max(minY, Math.min(ly, maxY));
    setLensPos({ x: lx, y: ly });
  }, [displayDims, lensSize]);

  // Throttle with rAF
  const frameRef = React.useRef(null);
  const onMouseMove = (e) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    const { clientX, clientY } = e;
    frameRef.current = requestAnimationFrame(() => moveLens(clientX, clientY));
  };

  const onTouchMove = (e) => {
    if (!e.touches?.[0]) return;
    const { clientX, clientY } = e.touches[0];
    moveLens(clientX, clientY);
  };

  const backgroundStyle = React.useMemo(() => {
    const { dw, dh, ox, oy } = displayDims;
    const centerX = lensPos.x + lensSize / 2 - ox; // relative to displayed image
    const centerY = lensPos.y + lensSize / 2 - oy;
    const bgX = -(centerX * zoomScale - previewWidth / 2);
    const bgY = -(centerY * zoomScale - previewHeight / 2);
    const bgSize = `${dw * zoomScale}px ${dh * zoomScale}px`;
    return {
      backgroundImage: `url(${src})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: `${bgX}px ${bgY}px`,
      backgroundSize: bgSize,
      width: previewWidth,
      height: previewHeight,
    };
  }, [displayDims, lensPos, lensSize, src, zoomScale, previewWidth, previewHeight]);

  const lensZoomStyle = React.useMemo(() => {
    const { dw, dh, ox, oy } = displayDims;
    const centerX = lensPos.x + lensSize / 2 - ox;
    const centerY = lensPos.y + lensSize / 2 - oy;
    const bgX = -(centerX * zoomScale - lensSize / 2);
    const bgY = -(centerY * zoomScale - lensSize / 2);
    const bgSize = `${dw * zoomScale}px ${dh * zoomScale}px`;
    return {
      backgroundImage: `url(${src})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: `${bgX}px ${bgY}px`,
      backgroundSize: bgSize,
      width: lensSize,
      height: lensSize,
      border: "2px solid rgba(130,43,226,0.8)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      pointerEvents: "none",
      borderRadius: 6,
      position: "absolute",
      left: lensPos.x,
      top: lensPos.y,
    };
  }, [displayDims, lensPos, lensSize, src, zoomScale]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={`relative select-none ${className}`}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onMouseMove={onMouseMove}
        onTouchStart={() => setShow(true)}
        onTouchEnd={() => setShow(false)}
        onTouchMove={onTouchMove}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-auto object-contain"
          onLoad={computeDisplay}
          onError={onError}
          draggable={false}
        />
        {show && <div style={lensZoomStyle} />}
      </div>
      {show && showPreview && (
        <div className="mt-3">
          <div
            aria-label="Zoom preview"
            style={{
              ...backgroundStyle,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          />
        </div>
      )}
    </div>
  );
}
