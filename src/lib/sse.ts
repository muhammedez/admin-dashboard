const clients = new Set<ReadableStreamController<Uint8Array>>()

export function addClient(controller: ReadableStreamController<Uint8Array>) {
  clients.add(controller)
  return () => clients.delete(controller)
}

export function broadcastChange(entity: string) {
  const msg = new TextEncoder().encode(`data: ${JSON.stringify({ entity })}\n\n`)
  for (const client of clients) {
    try {
      client.enqueue(msg)
    } catch {
      clients.delete(client)
    }
  }
}
