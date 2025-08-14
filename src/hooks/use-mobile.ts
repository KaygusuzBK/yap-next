import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // İlk anda (client'ta) mevcut pencere genişliğine göre doğru değeri ayarla
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : undefined
  )

  React.useEffect(() => {
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    // Resize dinleyicisi: matchMedia yerine resize ile tutarlı davranış
    window.addEventListener("resize", onChange)
    // Güvenlik: mount anında da bir kez değerlendir
    onChange()
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return Boolean(isMobile)
}
