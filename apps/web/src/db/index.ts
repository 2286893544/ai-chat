import type { Character, Conversation, Message } from '@ai-chat/shared'
import { indexedDbInfo } from '../local-data/storageKeys'

const DB_NAME = indexedDbInfo.name
const DB_VERSION = 1

export type StoreName = 'characters' | 'conversations' | 'messages'

export interface DBSchema {
  characters: Character
  conversations: Conversation
  messages: Message
}

function toStorable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('characters')) {
        const store = db.createObjectStore('characters', { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains('conversations')) {
        const store = db.createObjectStore('conversations', { keyPath: 'id' })
        store.createIndex('characterId', 'characterId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id' })
        store.createIndex('conversationId', 'conversationId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T>[]
): Promise<T | T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const result = fn(store)

    const requests = Array.isArray(result) ? result : [result]

    let completed = 0
    const results: T[] = []

    requests.forEach((req, i) => {
      req.onsuccess = () => {
        results[i] = req.result
        completed++
        if (completed === requests.length) {
          resolve(Array.isArray(result) ? results : results[0] as T)
        }
      }
      req.onerror = () => reject(req.error)
    })

    transaction.onerror = () => reject(transaction.error)
  })
}

// Character CRUD
export async function getAllCharacters(): Promise<Character[]> {
  const result = await withStore<Character[]>('characters', 'readonly', (store) => {
    return store.getAll()
  })
  return result as Character[]
}

export async function getCharacterById(id: string): Promise<Character | undefined> {
  const result = await withStore<Character>('characters', 'readonly', (store) => {
    return store.get(id)
  })
  return result as Character | undefined
}

export async function saveCharacter(character: Character): Promise<void> {
  const storable = toStorable(character)
  await withStore('characters', 'readwrite', (store) => {
    return store.put(storable)
  })
}

export async function deleteCharacter(id: string): Promise<void> {
  await withStore('characters', 'readwrite', (store) => {
    return store.delete(id)
  })
}

export async function deleteAllCharacters(): Promise<void> {
  await withStore('characters', 'readwrite', (store) => {
    return store.clear()
  })
}

// Conversation CRUD
export async function getAllConversations(): Promise<Conversation[]> {
  const result = await withStore<Conversation[]>('conversations', 'readonly', (store) => {
    return store.getAll()
  })
  return result as Conversation[]
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
  const result = await withStore<Conversation>('conversations', 'readonly', (store) => {
    return store.get(id)
  })
  return result as Conversation | undefined
}

export async function getConversationsByCharacterId(characterId: string): Promise<Conversation[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversations', 'readonly')
    const store = transaction.objectStore('conversations')
    const index = store.index('characterId')
    const request = index.getAll(characterId)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const storable = toStorable(conversation)
  await withStore('conversations', 'readwrite', (store) => {
    return store.put(storable)
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await withStore('conversations', 'readwrite', (store) => {
    return store.delete(id)
  })
  // Also delete all messages for this conversation
  const messages = await getMessagesByConversationId(id)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('messages', 'readwrite')
    const store = transaction.objectStore('messages')
    messages.forEach((msg) => store.delete(msg.id))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Message CRUD
export async function getMessagesByConversationId(conversationId: string): Promise<Message[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('messages', 'readonly')
    const store = transaction.objectStore('messages')
    const index = store.index('conversationId')
    const request = index.getAll(conversationId)
    request.onsuccess = () => {
      const messages = request.result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      resolve(messages)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getMessageById(id: string): Promise<Message | undefined> {
  const result = await withStore<Message>('messages', 'readonly', (store) => {
    return store.get(id)
  })
  return result as Message | undefined
}

export async function saveMessage(message: Message): Promise<void> {
  const storable = toStorable(message)
  await withStore('messages', 'readwrite', (store) => {
    return store.put(storable)
  })
}

export async function deleteMessage(id: string): Promise<void> {
  await withStore('messages', 'readwrite', (store) => {
    return store.delete(id)
  })
}

export async function deleteMessagesByConversationId(conversationId: string): Promise<void> {
  const messages = await getMessagesByConversationId(conversationId)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('messages', 'readwrite')
    const store = transaction.objectStore('messages')
    messages.forEach((msg) => store.delete(msg.id))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
