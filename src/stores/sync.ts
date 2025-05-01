import { onUnmounted, ref, watch } from 'vue'
import Peer from 'peerjs'
import { useDB } from '@/composables/useDB.ts'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useSyncStore = defineStore('sync', () => {
  const db = useDB()
  const clientId = ref(localStorage.getItem('client') ?? `life-coach-${uuidv4()}`)
  localStorage.setItem('client', clientId.value)
  const knownClients = ref(JSON.parse(localStorage.getItem('known-clients') ?? '[]'))
  watch(knownClients, kc => localStorage.setItem('known-clients', JSON.stringify(kc)), { deep: true, immediate: true })

  const connections = ref<Record<string, any>>({})
  const peer = new Peer(clientId.value, { debug: 3 })

  onUnmounted(() => peer.destroy())

  // Only receivers handle incoming data
  peer.on('connection', conn => {
    connections.value[conn.peer] = conn
    conn.on('data', (data: unknown) => {
      const { age: incomingAge } = db.unpack(data as string)
      if (incomingAge > db.getAge()) {
        db.fromString(data as string)
      }
    })
    conn.on('error', (err: any) => console.error(`Connection error with ${conn.peer}:`, err))
    conn.on('close', () => delete connections.value[conn.peer])
  })
  peer.on('error', console.error)

  // Sender initiates sync, sends data, but does not expect/handle data back
  function sync(targetId: string, trial = 0, force = false) {
    if (trial >= 3 || targetId === clientId.value) {
      return
    }
    let conn = connections.value[targetId]
    if (!conn || !conn.open) {
      try {
        conn = peer.connect(targetId)
        connections.value[targetId] = conn
        conn.on('open', () => conn.send(db.toString(force)))
        conn.on('error', (err: any) => {
          setTimeout(() => sync(targetId, trial + 1, force), 1000 * (trial + 1))
        })
        conn.on('close', () => delete connections.value[targetId])
      } catch {
        setTimeout(() => sync(targetId, trial + 1, force), 1000 * (trial + 1))
      }
    } else {
      conn.send(db.toString(force))
    }
  }

  const syncAll = (force = false) => knownClients.value.forEach((id: string) => sync(id, 0, force))

  return { syncAll, clientId, knownClients }
})
