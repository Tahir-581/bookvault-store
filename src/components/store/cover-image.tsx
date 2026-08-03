"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/placeholder-book.svg";

export function CoverImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [current, setCurrent] = useState(src || PLACEHOLDER);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => {
        if (current !== PLACEHOLDER) setCurrent(PLACEHOLDER);
      }}
    />
  );
}
