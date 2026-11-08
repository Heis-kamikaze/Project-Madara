import { useEffect } from 'react'

/** Sets the browser tab title, e.g. usePageTitle('Collections') → "Collections · Aradam". */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Aradam` : 'Aradam'
  }, [title])
}
