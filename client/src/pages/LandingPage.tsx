import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  Mail,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import {
  PageShell,
  Intro,
  Label,
  Field,
  Button,
  Swatch,
  Price,
  ProductCard,
  CollectionCard,
  BackLink,
  Stat,
  EmptyState,
} from "../components/Ui";
export default function LandingPage() {
  return (
    <PageShell wide>
      <section className="page-wrap">
        <div className="grid items-center gap-8 py-5 md:grid-cols-[.9fr_1.1fr] md:py-10">
          <div className="order-2 md:order-1">
            <div className="eyebrow mb-4">The Aradam Atelier · Lagos</div>
            <h1 className="serif max-w-xl text-5xl leading-[1.02] md:text-7xl">
              A house built
              <br />
              around <i>craft.</i>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-ink-soft">
              Considered pieces, made slowly and worn for a long time. Discover
              the current collection and the stories stitched into every detail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pieces" className="btn-primary">
                Explore the pieces <ArrowRight size={15} />
              </Link>
              <Link to="/collections" className="btn-outline">
                View collections
              </Link>
            </div>
            <div className="mt-14 grid max-w-sm grid-cols-3 border-t border-border pt-5">
              <Stat value="01" label="Atelier" />
              <Stat value="100%" label="Hand finished" />
              <Stat value="∞" label="Stories" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="swatch sw-garden relative aspect-[.92] md:aspect-[1.12]">
              <div className="absolute inset-x-6 bottom-6 text-ivory">
                <p className="eyebrow !text-bronze-light">
                  Garden Collection 2026
                </p>
                <p className="serif mt-2 text-4xl md:text-6xl">
                  In full bloom.
                </p>
                <p className="mt-2 text-xs text-white/75">
                  Current runway film · Editorial preview
                </p>
              </div>
              <span className="absolute right-6 top-6 rounded-full border border-white/40 px-4 py-2 text-[9px] uppercase tracking-widest text-white">
                Play film ↗
              </span>
            </div>
          </div>
        </div>
        <div className="mb-6 mt-14 flex items-end justify-between">
          <div>
            <div className="eyebrow">The shop window</div>
            <h2 className="serif mt-2 text-3xl">Pieces, at random.</h2>
          </div>
          <Link to="/pieces" className="text-xs underline underline-offset-4">
            View all pieces
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ProductCard />
          <ProductCard name="Desert Knit" price="₦52,000" kind="clay" />
          <ProductCard name="Night Study" price="₦39,000" kind="espresso" />
          <ProductCard name="Linen Form" price="₦45,500" kind="linen" />
        </div>
      </section>
    </PageShell>
  );
}
