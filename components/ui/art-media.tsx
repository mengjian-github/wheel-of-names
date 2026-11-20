// Art media — how a picture is composed into the page, the way a designer
// places it, never a rectangle dropped beside text (owner review 2026-11-05:
// every picture read as "forced in"). Each asset in the design carries its
// treatment; pass it straight through. Server-safe: no state, no effects.
// The look lives in the platform stylesheet (.art-*), painted in the site's
// own tokens, so every site gets the craft in its own colours.
// Exports: ArtMedia, ArtFloat, ArtWall, SiteImage.
// Usage:
//   <ArtMedia treatment="backdrop" src="/images/dj-mid-set.webp" alt="...">
//     <h1>...</h1><p>...</p>            // copy sits over the picture behind a scrim
//   </ArtMedia>
//   <ArtMedia treatment="masked" shape="arch" src="/images/a.webp" alt="..." />
//   <ArtMedia treatment="cutout" src="/images/b.webp" alt="..." />   // stands in front, breaks the edge
//   <ArtMedia treatment="collage" src="/images/c.webp" alt="...">
//     <span>8A · C minor</span>          // a fragment of the tool's own UI or a result chip
//   </ArtMedia>
//   <ArtMedia treatment="framed" src="/images/d.webp" alt="..." caption="..." />
//   <ArtMedia treatment="spot" src="/images/e.webp" alt="" />        // small illustration beside a step
//   <ArtFloat images={[{ src, alt }, { src, alt }]}><ToolCard ... /></ArtFloat>  // tilted cards drift around the centre
//   <ArtWall images={[{ src, alt }, ...]} />                                     // perspective wall of tiles
// Rules: one treatment per picture, as the design declared it; neighbouring
//   sections use different treatments; text over a backdrop goes in children.
//   The first screen's picture passes priority (loads first, never lazy).
// Delivery (claude-seo image rules, 2026-11-18): every picture renders as a
//   <picture> of the AVIF/WebP sizes the prebuild made (lib/images.ts), with
//   the browser choosing the size the layout shows, and the img carries its
//   real width and height so the page never jumps while it loads. Beat
//   Maker's hero was a 2,496 px, 345 KB JPEG shown at most 1,224 px wide.
//   A picture outside this kit uses SiteImage the same way.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { imageDerivatives } from "@/lib/images";

export type ArtTreatment = "backdrop" | "masked" | "cutout" | "float" | "collage" | "wall" | "framed" | "spot";
export type ArtShape = "arch" | "circle" | "slant" | "blob";

export interface ArtMediaProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  treatment: ArtTreatment;
  src: string;
  alt: string;
  /** Mask shape for treatment="masked". */
  shape?: ArtShape;
  /** Reader-facing caption (framed). */
  caption?: ReactNode;
  /** backdrop: the copy over the picture. collage: the UI fragment or chip layered on it. */
  children?: ReactNode;
  /** The first screen's picture: loads eagerly. */
  priority?: boolean;
}

/** How wide each treatment shows on screen, so the browser fetches no bigger a file than that. */
const TREATMENT_SIZES: Record<ArtTreatment, string> = {
  backdrop: "100vw",
  wall: "(min-width: 768px) 34vw, 50vw",
  float: "(min-width: 768px) 22vw, 45vw",
  spot: "(min-width: 768px) 240px, 40vw",
  masked: "(min-width: 1024px) 50vw, 100vw",
  cutout: "(min-width: 1024px) 50vw, 100vw",
  collage: "(min-width: 1024px) 50vw, 100vw",
  framed: "(min-width: 1024px) 60vw, 100vw",
};

export interface SiteImageProps {
  src: string;
  alt: string;
  /** The first screen's picture: fetched first, never lazy. */
  priority?: boolean;
  /** How wide it shows, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes?: string;
  className?: string;
}

/**
 * One picture, delivered right: AVIF/WebP at the size the layout shows, its
 * real width and height, lazy below the first screen. A picture the prebuild
 * did not process (an SVG, a remote URL) renders as a plain img.
 */
export function SiteImage({ src, alt, priority, sizes = "(min-width: 1024px) 50vw, 100vw", className }: SiteImageProps) {
  const derived = imageDerivatives(src);
  const img = (
    <img
      src={src}
      alt={alt}
      className={className}
      width={derived?.width}
      height={derived?.height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
    />
  );
  if (!derived) return img;
  return (
    <picture>
      {derived.sources.map((source) => <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />)}
      {img}
    </picture>
  );
}

function Img({ src, alt, priority, treatment }: { src: string; alt: string; priority?: boolean; treatment: ArtTreatment }) {
  return <SiteImage src={src} alt={alt} priority={priority} sizes={TREATMENT_SIZES[treatment]} />;
}

export function ArtMedia({ treatment, src, alt, shape, caption, children, priority, className, ...props }: ArtMediaProps) {
  if (treatment === "backdrop") {
    return (
      <div data-art="backdrop" className={cn("art art-backdrop", className)} {...props}>
        <div className="art-backdrop-media" aria-hidden={alt ? undefined : true}><Img src={src} alt={alt} priority={priority} treatment={treatment} /></div>
        {children ? <div className="art-backdrop-content">{children}</div> : null}
      </div>
    );
  }
  if (treatment === "collage") {
    return (
      <figure data-art="collage" className={cn("art art-collage", className)} {...props}>
        <Img src={src} alt={alt} priority={priority} treatment={treatment} />
        {children ? <div className="art-collage-chip">{children}</div> : null}
      </figure>
    );
  }
  const treatmentClass = treatment === "float" || treatment === "wall" ? "framed" : treatment;
  return (
    <figure data-art={treatmentClass} data-shape={treatment === "masked" ? shape ?? "arch" : undefined}
      className={cn("art", `art-${treatmentClass}`, className)} {...props}>
      <Img src={src} alt={alt} priority={priority} treatment={treatment} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface ArtFloatProps extends HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt: string }[];
  /** The centre the cards drift around: the tool card, the headline, an input. */
  children: ReactNode;
}

export function ArtFloat({ images, children, className, ...props }: ArtFloatProps) {
  return (
    <div data-art="float" className={cn("art art-float", className)} {...props}>
      {images.slice(0, 4).map((image, index) => (
        <figure key={index} className="art-float-card" data-slot={index} aria-hidden={image.alt ? undefined : true}>
          <SiteImage src={image.src} alt={image.alt} sizes={TREATMENT_SIZES.float} />
        </figure>
      ))}
      <div className="art-float-centre">{children}</div>
    </div>
  );
}

export interface ArtWallProps extends HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt: string; caption?: ReactNode }[];
}

export function ArtWall({ images, className, ...props }: ArtWallProps) {
  return (
    <div data-art="wall" className={cn("art art-wall", className)} {...props}>
      <div className="art-wall-plane">
        {images.slice(0, 9).map((image) => (
          <figure key={image.src} className="art-wall-tile">
            <SiteImage src={image.src} alt={image.alt} sizes={TREATMENT_SIZES.wall} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </div>
  );
}
