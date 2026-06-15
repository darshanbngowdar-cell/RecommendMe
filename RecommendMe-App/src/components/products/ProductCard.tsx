import { ProductItem } from "@/services/api";
import { Star, ExternalLink, ImageOff, ShoppingCart } from "lucide-react";

/* ─── helper: 5-star row ─────────────────────────────────────── */
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <Star
            key={i}
            className={`h-3 w-3 ${
              filled
                ? "fill-amber-400 text-amber-400"
                : half
                ? "fill-amber-400/50 text-amber-400"
                : "fill-transparent text-amber-300/40"
            }`}
          />
        );
      })}
    </div>
  );
}

interface ProductCardProps {
  product: ProductItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasBuyLink = Boolean(product.buyLink && product.buyLink !== "#");
  const cta = hasBuyLink
    ? { icon: <ShoppingCart className="h-3.5 w-3.5" />, label: "Buy now" }
    : { icon: <ExternalLink className="h-3.5 w-3.5" />, label: "View" };

  return (
    <div className="group relative flex flex-col w-[240px] min-w-[240px] rounded-2xl bg-card border border-border/60 hover:border-primary/25 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1.5 transition-all duration-300 ease-out overflow-hidden">

      {/* ── Image ─────────────────────────────────────────────── */}
      <div className="relative h-[155px] bg-gradient-to-br from-secondary/60 via-secondary/30 to-background overflow-hidden flex items-center justify-center shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
            <ImageOff className="h-8 w-8" />
            <span className="text-[10px] tracking-wide">No image</span>
          </div>
        )}

        {/* Fade into card bg */}
        <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-3.5 pt-2.5 pb-3 gap-1.5">
        {/* Source badge */}
        {product.source && (
          <span className="self-start text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            {product.source}
          </span>
        )}

        {/* Product name */}
        <h4 className="text-[12.5px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.productName}
        </h4>

        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] text-muted-foreground/70 font-medium -mt-0.5">
            {product.brand}
          </p>
        )}

        {/* Price */}
        {product.priceInr && (
          <p className="text-[15px] font-bold text-foreground leading-none">
            {product.priceInr}
          </p>
        )}

        {/* Stars + rating + reviews */}
        {product.rating != null && product.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRow rating={product.rating} />
            <span className="text-[11px] font-semibold text-amber-500 leading-none">{product.rating}</span>
            {product.reviewsCount != null && product.reviewsCount > 0 && (
              <span className="text-[10px] text-muted-foreground/60">({product.reviewsCount.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Short description */}
        {product.shortDescription && (
          <p className="text-[10.5px] text-muted-foreground/70 leading-relaxed line-clamp-2 flex-1 mt-0.5">
            {product.shortDescription}
          </p>
        )}

        {/* Delivery / availability info */}
        {(product.deliveryInfo || product.availability) && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {product.availability && <span>{product.availability}</span>}
            {product.availability && product.deliveryInfo && <span> · </span>}
            {product.deliveryInfo && <span>{product.deliveryInfo}</span>}
          </p>
        )}

        {/* Buy Now button */}
        <a
          href={hasBuyLink ? product.buyLink : "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            if (!hasBuyLink) {
              e.preventDefault();
            }
          }}
          aria-label={`Buy ${product.productName}`}
          className="mt-auto w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 shadow-sm"
        >
          {cta.icon}
          {cta.label}
          <ExternalLink className="h-3 w-3 ml-0.5 opacity-60 shrink-0" />
        </a>
      </div>
    </div>
  );
}