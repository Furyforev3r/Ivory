import axios from "axios"
import { writable, get } from "svelte/store"
import { user } from "./loginState"

export const account = writable<any>(null)
export const accountLoading = writable(false)

let loadedForUID: string | null = null
let inFlight: Promise<void> | null = null

async function fetchAccount(uid: string) {
    const response = await axios.get(`/api/getUser/?uid=${uid}`)
    return response.data
}

export async function ensureAccount(uid: string) {
    if (!uid) return

    if (loadedForUID === uid && get(account)) return

    if (inFlight) return inFlight

    accountLoading.set(true)
    inFlight = fetchAccount(uid)
        .then((data) => {
            account.set(data)
            loadedForUID = uid
        })
        .catch((error) => {
            console.error("Failed to load account:", error)
        })
        .finally(() => {
            accountLoading.set(false)
            inFlight = null
        })

    return inFlight
}

export async function refreshAccount(uid: string) {
    loadedForUID = null
    return ensureAccount(uid)
}

function reset() {
    account.set(null)
    loadedForUID = null
    inFlight = null
}

user.subscribe((value) => {
    if (!value || value === "Loading...") {
        reset()
    }
})
