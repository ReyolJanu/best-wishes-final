"use client";

import React from "react";

function formatDimensions(dimensions) {
  if (!dimensions || typeof dimensions !== "object") return null;
  const { length, width, height } = dimensions || {};
  const parts = [length, width, height]
    .map((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null));
  // Show only if at least one dimension is a valid number and > 0
  const hasAny = parts.some((v) => v && v > 0);
  if (!hasAny) return null;
  const safe = parts.map((v) => (v && v > 0 ? v : "-"));
  return `${safe[0]} × ${safe[1]} × ${safe[2]}`;
}

export default function ProductSpecs({ product }) {
  if (!product) return null;

  const fields = [
    { label: "Name", value: product.name },
    { label: "SKU", value: product.sku },
    { label: "Short Description", value: product.shortDescription },
    { label: "Detailed Description", value: product.detailedDescription },
    { label: "Weight", value: (product.weight ?? "") !== "" ? product.weight : null },
    { label: "Shipping Class", value: product.shippingClass },
  ];

  const dimensions = formatDimensions(product.dimensions);

  return (
    <div className="mt-6 border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Product Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-h-[44px]">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
            <div className="text-sm text-gray-900 break-words">{value ? String(value) : "N/A"}</div>
          </div>
        ))}

        {dimensions && (
          <div className="min-h-[44px]">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dimensions</div>
            <div className="text-sm text-gray-900">{dimensions}</div>
          </div>
        )}
      </div>
    </div>
  );
}

