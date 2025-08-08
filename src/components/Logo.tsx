"use client"

import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  size?: number
  withLink?: boolean
  className?: string
  alt?: string
}

export default function Logo({
  size = 28,
  withLink = true,
  className,
  alt = "YAP",
}: LogoProps) {
  const img = (
    <Image
      src="/YAP-Proje-Yönetimi-Logosu.svg"
      width={size}
      height={size}
      alt={alt}
      className={className}
      priority
    />
  )
  return withLink ? (
    <Link href="/" aria-label={alt}>
      {img}
    </Link>
  ) : (
    img
  )
}


