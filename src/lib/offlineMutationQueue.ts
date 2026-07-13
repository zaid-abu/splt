import AsyncStorage from "@react-native-async-storage/async-storage"

const QUEUE_KEY = "offline_mutation_queue"

export interface QueuedMutation {
  id: string
  timestamp: number
  type: "expense" | "settlement" | "group" | "friend"
  action: "create" | "update" | "delete"
  payload: unknown
}

export const offlineQueue = {
  async enqueue(mutation: Omit<QueuedMutation, "id" | "timestamp">): Promise<void> {
    const queue = await this.getAll()
    queue.push({ ...mutation, id: Date.now().toString(), timestamp: Date.now() })
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  },

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll()
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((m) => m.id !== id)))
  },

  async getAll(): Promise<QueuedMutation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  },

  async processQueue(): Promise<void> {
    const queue = await this.getAll()
    for (const mutation of queue) {
      try {
        await this.executeMutation(mutation)
        await this.dequeue(mutation.id)
      } catch {
        break
      }
    }
  },

  async executeMutation(mutation: QueuedMutation): Promise<void> {
    console.log(`Replaying ${mutation.action} ${mutation.type}`, mutation.payload)
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY)
  },
}
