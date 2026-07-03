import axios from "axios"
import { writable, derived } from "svelte/store"
import { browser } from "$app/environment"

export const notifications = writable<any[]>([])
export const lastRead = writable<any>(null)
export const notificationsLoaded = writable(false)

function toMillis(timestamp: any) {
    if (!timestamp) return 0
    if (timestamp._seconds) return timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1e6
    return 0
}

export const unreadCount = derived([notifications, lastRead], ([$notifications, $lastRead]) => {
    const lastReadMillis = toMillis($lastRead)
    return $notifications.filter((n) => toMillis(n.createdAt) > lastReadMillis).length
})

let loadedForUID: string | null = null

export async function loadNotifications(uid: string, token: string) {
    if (!browser || !uid) return

    try {
        const response = await axios.get(`/api/getNotifications?uid=${uid}&token=${token}`)
        notifications.set(response.data.notifications)
        lastRead.set(response.data.lastRead)
        loadedForUID = uid
        notificationsLoaded.set(true)
    } catch (error) {
        console.error("Failed to load notifications:", error)
    }
}

export async function ensureNotifications(uid: string, token: string) {
    if (!browser || !uid || loadedForUID === uid) return
    return loadNotifications(uid, token)
}

export async function markSeen(uid: string, token: string) {
    if (!browser) return

    const now = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }
    lastRead.set(now)

    try {
        await axios.post(`/api/markNotificationsSeen?uid=${uid}&token=${token}`)
    } catch (error) {
        console.error("Failed to mark notifications as seen:", error)
    }
}
