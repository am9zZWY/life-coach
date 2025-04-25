import { compress, decompress } from 'lz-string'

const MASTER_KEY = 'allKeys'

export function useDB() {
  // Get all tracked keys from localStorage
  function getAllKeys(): string[] {
    return JSON.parse(localStorage.getItem(MASTER_KEY) ?? '[]')
  }

  // Set a value in localStorage and update the master key list
  function set<T>(key: string, value: T): void {
    if (value == null) {
      console.warn('Value is null or undefined')
      return
    }
    const allKeys = getAllKeys()
    if (!allKeys.includes(key)) {
      allKeys.push(key)
    }
    localStorage.setItem(key, compress(JSON.stringify(value)))
    localStorage.setItem(MASTER_KEY, JSON.stringify(allKeys))
  }

  // Get a value from localStorage and decompress/parse it
  function get<T>(key: string): T | null {
    const value = localStorage.getItem(key)
    if (!value) {
      console.warn(`No ${key} in db`)
      return null
    }
    const uncompressed = decompress(value)
    return uncompressed ? JSON.parse(uncompressed) as T : null
  }

  // Remove a value and update the master key list
  function remove(key: string): void {
    localStorage.removeItem(key)
    const allKeys = getAllKeys().filter(k => k !== key)
    localStorage.setItem(MASTER_KEY, JSON.stringify(allKeys))
  }

  // Export all tracked keys and their values as a compressed string
  function toLZString(): string {
    const keys = getAllKeys()
    const values = keys.map(key => localStorage.getItem(key) ?? null)
    return compress(JSON.stringify({ keys, values }))
  }

  // Import from a compressed string, restoring all keys/values
  function fromLZString(lzString: string): void {
    const { keys, values } = JSON.parse(decompress(lzString) ?? '{}')
    if (!Array.isArray(keys) || !Array.isArray(values)) {
      return
    }
    keys.forEach((key, i) => {
      if (values[i] != null) {
        localStorage.setItem(key, values[i])
      }
    })
    localStorage.setItem(MASTER_KEY, JSON.stringify(keys))
  }

  return { get, set, remove, toLZString, fromLZString }
}
