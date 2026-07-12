import { useEffect, useRef } from "react"

export function useSSE(onEvent: (entity: string, data?: Record<string, unknown>) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource("/api/events")
      es.onmessage = (e) => {
        try {
          const { entity, ...rest } = JSON.parse(e.data)
          onEventRef.current(entity, Object.keys(rest).length ? rest : undefined)
        } catch {}
      }
      es.onerror = () => {
        es?.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      es?.close()
      clearTimeout(retryTimeout)
    }
  }, [])
}
