import { useState } from "react";

type Image = { url: string; id: string };

type ImageCarouselProps = {
  images: Image[];
  className?: string;
};

const ImageCarousel = ({ images, className = "" }: ImageCarouselProps) => {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  };

  return (
    <div className={`relative group overflow-hidden rounded-[24px] mb-5 ${className}`}>
      <img
        src={images[idx].url}
        alt={`slide ${idx + 1}`}
        className="h-64 xs:h-[400px] lg:h-[450px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]" />

      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-1/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition hover:bg-dark-1/90 z-10"
            >
              ‹
            </button>
          )}
          {idx < images.length - 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-1/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition hover:bg-dark-1/90 z-10"
            >
              ›
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/40"}`}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-dark-1/70 backdrop-blur-sm text-white tiny-medium z-10">
            {idx + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
