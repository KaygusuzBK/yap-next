import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
    // İlk render'da mevcut pencere genişliğine göre değeri ayarla
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }, [])

  React.useEffect(() => {
    if (!isClient) return

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Resize dinleyicisi
    window.addEventListener("resize", onChange)
    
    return () => window.removeEventListener("resize", onChange)
  }, [isClient])

  // Server-side rendering sırasında undefined döndür
  if (!isClient) return undefined
  
  return isMobile
}
