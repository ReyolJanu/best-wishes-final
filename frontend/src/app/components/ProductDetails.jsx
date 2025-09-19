"use client";

import React from "react";
import { Info, Hash, Package, Ruler, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

function Row({ id, label, icon: Icon, children, className = "" }) {
  return (
    <div role="listitem" className={`border rounded-md p-3 ${className}`}>
      <div id={`${id}-label`} className="flex items-center gap-2">
        {Icon ? <Icon aria-hidden="true" /> : null}
        <strong>{label}</strong>
      </div>
      <Separator className="my-2" />
      <div aria-labelledby={`${id}-label`} className="text-sm">
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
      <Row key="desc" id="spec-desc" label="Description" icon={Info} className="sm:col-span-2 lg:col-span-3">
        {shortDescription ? <p>{shortDescription}</p> : null}
        {detailedDescription ? <p>{detailedDescription}</p> : null}
      </Row>
    ),
    sku && (
      <Row key="sku" id="spec-sku" label="SKU" icon={Hash}>
        <p>{sku}</p>
      </Row>
    ),
    (weight !== null && weight !== "") && (
      <Row key="weight" id="spec-weight" label="Weight" icon={Package}>
        <p>{weight}</p>
      </Row>
    ),
    dimensions && (
      <Row key="dimensions" id="spec-dimensions" label="Dimensions" icon={Ruler}>
        <p>{dimensions}</p>
      </Row>
    ),
    shippingClass && (
      <Row key="shipping" id="spec-shipping" label="Shipping Class" icon={Truck}>
        <p>{shippingClass}</p>
      </Row>
    ),
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading">Product Details</h2>
      <div role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows}
      </div>
    </section>
  );
}
