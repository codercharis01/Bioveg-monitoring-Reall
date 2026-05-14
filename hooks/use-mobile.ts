import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set initial value inside the effect callback or using a function to avoid synchronous cascading render
    const updateIsMobile = () => {
      setIsMobile(mql.matches)
    }

    mql.addEventListener("change", updateIsMobile)
    setTimeout(updateIsMobile, 0) // Delay the initial execution to avoid sync warning
    return () => mql.removeEventListener("change", updateIsMobile)
  }, [])

  return !!isMobile
}
