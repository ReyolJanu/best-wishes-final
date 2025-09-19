"use client";

import React from "react";
import { Sparkles, Package, Ruler, Truck, BadgeCheck } from "lucide-react";

function formatDimensions(dimensions) {
  if (!dimensions || typeof dimensions !== "object") return null;
  const { length, width, height } = dimensions || {};
  const parts = [length, width, height]
    .map((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null));
  const hasAny = parts.some((v) => v && v > 0);
  if (!hasAny) return null;
  const safe = parts.map((v) => (v && v > 0 ? v : "-"));
  return `${safe[0]} × ${safe[1]} × ${safe[2]}`;
}

export default function BentoProductGrid({ product }) {
  if (!product) return null;

  // Optional per-SKU overrides (useful when certain fields are missing in data)
  const isGoldGardenBox = product?.sku === "HMLIV-STORAGE-106";
  const description =
    product?.detailedDescription ||
    product?.shortDescription ||
    (isGoldGardenBox
      ? "A durable gold-painted wooden storage box, perfect for keeping garden tools organized and stylish."
      : "");
  const dimsRaw = formatDimensions(product.dimensions);
  const dims = dimsRaw || (isGoldGardenBox ? "50 × 40 × 30" : null);
  const weightDisplay =
    product?.weight !== undefined && product?.weight !== null
      ? product.weight
      : isGoldGardenBox
        ? 3
        : "N/A";
  const shippingClassDisplay = product?.shippingClass || (isGoldGardenBox ? "standard" : "N/A");
  const title = product?.name || "Product";

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Design Highlights</h3>
      <div
        className="grid grid-cols-1 sm:grid-cols-6 auto-rows-[minmax(120px,auto)] gap-3"
      >
        {/* 2025 Best Design badge */}
        <div className="sm:col-span-3 row-span-2 rounded-xl p-5 bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium">
                <Sparkles size={14} />
                2025 Best Design
              </div>
              <h4 className="text-xl font-bold leading-tight mt-1 line-clamp-2">
                {title}
              </h4>
            </div>
            <BadgeCheck className="opacity-80" />
          </div>
          <p className="mt-3 text-white/90 text-sm leading-relaxed line-clamp-5">
            {description}
          </p>
        </div>

        {/* Description card */}
        <div className="sm:col-span-3 row-span-2 rounded-xl p-5 border bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Package size={16} />
            Description
          </div>
          <p className="mt-2 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Specs card */}
        <div className="sm:col-span-2 row-span-2 rounded-xl p-5 border bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Product Details</div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Name</div>
              <div className="text-gray-900 dark:text-gray-100">{product?.name || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">SKU</div>
              <div className="text-gray-900 dark:text-gray-100">{product?.sku || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Weight</div>
              <div className="text-gray-900 dark:text-gray-100">{weightDisplay}</div>
            </div>
          </div>
        </div>

        {/* Dimensions card */}
        <div className="sm:col-span-2 row-span-1 rounded-xl p-5 border bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Ruler size={16} />
            Dimensions
          </div>
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {dims || "N/A"}
          </div>
        </div>

        {/* Shipping class card */}
        <div className="sm:col-span-2 row-span-1 rounded-xl p-5 border bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Truck size={16} />
            Shipping Class
          </div>
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {shippingClassDisplay}
          </div>
        </div>
      </div>
    </section>
  );
}
