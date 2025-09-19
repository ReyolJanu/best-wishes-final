"use client";

import React from "react";

function formatDimensions(dimensions) {
  if (!dimensions || typeof dimensions !== "object") return null;
  const { length, width, height } = dimensions || {};
  const nums = [length, width, height].map((v) =>
    typeof v === "number" && !Number.isNaN(v) ? v : null
  );
  const hasAny = nums.some((v) => v && v > 0);
  if (!hasAny) return null;
  const safe = nums.map((v) => (v && v > 0 ? v : "-"));
  return `${safe[0]} × ${safe[1]} × ${safe[2]}`;
}

function Row({ id, label, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{open ? "−" : "+"}</span> {label}
      </button>
      <div id={id} role="region" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

export default function ProductDetails({ product }) {
  if (!product) return null;

  const shortDescription = product?.shortDescription;
  const detailedDescription = product?.detailedDescription;
  const sku = product?.sku ?? null;
  const weight = product?.weight ?? null;
  const dimensions = formatDimensions(product?.dimensions);
  const shippingClass = product?.shippingClass ?? null;

  const rows = [
    (shortDescription || detailedDescription) && (
      <Row key="desc" id="spec-desc" label="Description">
        {shortDescription && <p>{shortDescription}</p>}
        {detailedDescription && <p>{detailedDescription}</p>}
      </Row>
    ),
    sku && (
      <Row key="sku" id="spec-sku" label="SKU">
        <p>{sku}</p>
      </Row>
    ),
    (weight !== null && weight !== "") && (
      <Row key="weight" id="spec-weight" label="Weight">
        <p>{weight}</p>
      </Row>
    ),
    dimensions && (
      <Row key="dimensions" id="spec-dimensions" label="Dimensions">
        <p>{dimensions}</p>
      </Row>
    ),
    shippingClass && (
      <Row key="shipping" id="spec-shipping" label="Shipping Class">
        <p className="capitalize">{shippingClass}</p>
      </Row>
    ),
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading">View Product Details</h2>
      <div>{rows}</div>
    </section>
  );
}
