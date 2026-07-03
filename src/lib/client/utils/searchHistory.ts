import { writable } from "svelte/store"
import { browser } from "$app/environment"

const STORAGE_KEY = "ivory-search-history"
const MAX_ITEMS = 8

function readHistory(): string[] {
    if (!browser) return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch (error) {
        return []
    }
}

export const searchHistory = writable<string[]>(readHistory())

function persist(items: string[]) {
    if (!browser) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addSearchHistory(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return

    searchHistory.update((items) => {
        const next = [trimmed, ...items.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ITEMS)
        persist(next)
        return next
    })
}

export function removeSearchHistoryItem(query: string) {
    searchHistory.update((items) => {
        const next = items.filter((item) => item !== query)
        persist(next)
        return next
    })
}

export function clearSearchHistory() {
    searchHistory.set([])
    persist([])
}
