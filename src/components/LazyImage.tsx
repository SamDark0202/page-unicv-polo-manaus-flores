import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  srcWebP?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  decoding?: "async" | "sync" | "auto";
  loading?: "lazy" | "eager";
}

export default function LazyImage({
  src,
  srcWebP,
  alt,
  width,
  height,
  className = "",
  decoding = "async",
  loading = "lazy",
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState(loading === "eager" ? src : "");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Intersection Observer para lazy loading
    let observer: IntersectionObserver | null = null;
    
    if (loading === "lazy" && imgRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer?.unobserve(entry.target);
          }
        },
        {
          rootMargin: "50px",
        }
      );
      observer.observe(imgRef.current);
    }

    return () => observer?.disconnect();
  }, [src, loading]);

  return srcWebP ? (
    <picture>
      <source srcSet={imageSrc ? srcWebP : ""} type="image/webp" />
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-75"} transition-opacity`}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
      />
    </picture>
  ) : (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${isLoaded ? "opacity-100" : "opacity-75"} transition-opacity`}
      decoding={decoding}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
