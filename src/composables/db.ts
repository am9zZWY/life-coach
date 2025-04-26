import { compress, compressToBase64, decompress, decompressFromBase64 } from 'lz-string'

const MASTER_KEY = 'allKeys'

export function useDB() {
  function getAllKeys(): string[] {
    return JSON.parse(localStorage.getItem(MASTER_KEY) ?? '[]')
  }

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

  function get<T>(key: string): T | null {
    const value = localStorage.getItem(key)
    if (!value) {
      console.warn(`No ${key} in db`)
      return null
    }
    const uncompressed = decompress(value)
    return uncompressed ? JSON.parse(uncompressed) as T : null
  }

  function remove(key: string): void {
    localStorage.removeItem(key)
    const allKeys = getAllKeys().filter(k => k !== key)
    localStorage.setItem(MASTER_KEY, JSON.stringify(allKeys))
  }

  function toString(): string {
    const keys = getAllKeys()
    const values = keys.map(key => localStorage.getItem(key) ?? null)
    return compressToBase64(JSON.stringify({ keys, values }))
  }

  function fromString(input: string): void {
    const { keys, values } = JSON.parse(decompressFromBase64(input) ?? '{}')
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

  return { get, set, remove, toString, fromString }
}
