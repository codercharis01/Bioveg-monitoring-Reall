import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoordinate(val: number | string | undefined | null, isLng: boolean, format: string) {
  if (val === undefined || val === null) return '';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return String(val);
  
  if (format === 'DD') {
    return num.toFixed(6);
  } else {
    // DMS
    const absVal = Math.abs(num);
    const d = Math.floor(absVal);
    const m = Math.floor((absVal - d) * 60);
    const s = ((absVal - d - m / 60) * 3600).toFixed(2);
    const dir = isLng ? (num >= 0 ? 'E' : 'W') : (num >= 0 ? 'N' : 'S');
    return `${d}°${m}'${s}"${dir}`;
  }
}
