import { ProductType, Category } from "@/services/api";
import ProductCard from "./ProductCard";
import { Package, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";

interface RecommendationResultsProps {
  category?: string;
  productTypes?: ProductType[];
  /** Legacy: for backward compat with old Category format */
  categories?: Category[];
}

/* ── Horizontal scroll row ──────────────────────────────── */
function ProductScrollRow({ items }: { items: ProductType["productItems"] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMOUNT = 260 * 2;

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                     w-8 h-8 rounded-full bg-background border border-border shadow-md
                     flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                     w-8 h-8 rounded-full bg-background border border-border shadow-md
                     flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      )}

      <div
        ref={rowRef}
        onScroll={updateArrows}
        className="flex flex-row gap-4 overflow-x-auto overflow-y-visible pb-3 pt-1 px-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {items.map((item, j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: j * 0.07, duration: 0.28, ease: "easeOut" }}
            className="shrink-0"
          >
            <ProductCard product={item} />
          </motion.div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-6 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-card to-transparent" />
    </div>
  );
}

/* ── Product Type section ───────────────────────────────── */
function ProductTypeSection({ pt, index, allFailed }: { pt: ProductType; index: number; allFailed?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasProducts = pt.productItems.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border rounded-2xl overflow-hidden bg-card"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {index + 1}. {pt.productType}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasProducts && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hidden sm:inline-flex">
              {pt.productItems.length} item{pt.productItems.length !== 1 ? "s" : ""}
            </span>
          )}
          {pt.serpError && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full hidden sm:inline-flex">
              Limited
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Description */}
          {pt.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {pt.description}
            </p>
          )}

          {/* Products or error */}
          {hasProducts ? (
            <ProductScrollRow items={pt.productItems} />
          ) : pt.serpError && !allFailed ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {pt.serpErrorMessage || `Couldn't load live products for ${pt.productType}.`}
                </p>
                <p className="text-[11px] text-amber-600/70 dark:text-amber-500/50 mt-0.5">
                  The description above still applies — try searching directly for "{pt.productType}" online.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

/* ── Legacy category section (backward compat) ──────────── */
function LegacyCategorySection({ category, index }: { category: Category; index: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border rounded-2xl overflow-hidden bg-card"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {index + 1}. {category.name}
          </h3>
          {category.tagline && (
            <p className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mt-0.5">{category.tagline}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hidden sm:inline-flex">
            {category.products.length} item{category.products.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {category.why_needed && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{category.why_needed}</p>
          )}
          <div
            className="flex flex-row gap-4 overflow-x-auto overflow-y-visible pb-3 pt-1 px-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {category.products.map((product, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: j * 0.07, duration: 0.28, ease: "easeOut" }}
                className="shrink-0"
              >
                <ProductCard
                  product={{
                    productName: product.title,
                    imageUrl: product.thumbnail,
                    priceInr: product.price,
                    shortDescription: product.reason,
                    buyLink: product.link,
                    rating: product.rating || null,
                    brand: null,
                    reviewsCount: product.reviews ? parseInt(product.reviews, 10) || null : null,
                    deliveryInfo: null,
                    availability: null,
                    source: product.source || null,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Root export ──────────────────────────────────────────── */
export default function RecommendationResults({
  category,
  productTypes,
  categories,
}: RecommendationResultsProps) {
  // New format: Product Types
  if (productTypes && productTypes.length > 0) {
    const displayTypes = productTypes.filter(
      (pt) => pt.productItems.length > 0 || pt.serpError || pt.description
    );

    if (displayTypes.length === 0) return null;

    const allSerpFailed = productTypes.every((pt) => pt.serpError || pt.productItems.length === 0);

    return (
      <div className="space-y-3">
        {/* Category header */}
        {category && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-1"
          >
            <h2 className="text-base font-bold text-foreground">{category}</h2>
          </motion.div>
        )}

        {allSerpFailed && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-2.5 mt-2 mb-4"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Live product data is currently unavailable. Showing AI-generated recommendations.
            </p>
          </motion.div>
        )}

        {displayTypes.map((pt, i) => (
          <ProductTypeSection key={`${pt.productType}-${i}`} pt={pt} index={i} allFailed={allSerpFailed} />
        ))}
      </div>
    );
  }

  // Legacy format: Categories
  if (categories && categories.length > 0) {
    const displayCategories = categories.filter((c) => (c.products || []).length > 0);
    if (displayCategories.length === 0) return null;

    return (
      <div className="space-y-3">
        {displayCategories.map((cat, i) => (
          <LegacyCategorySection key={`${cat.name}-${i}`} category={cat} index={i} />
        ))}
      </div>
    );
  }

  return null;
}

// Also export as CategoryList for backward compat
export { RecommendationResults as CategoryList };