import { addClient } from "@/lib/sse"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const abortSignal = request.signal

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const remove = addClient(controller)
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"))

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
          remove()
        }
      }, 15000)

      abortSignal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        remove()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
