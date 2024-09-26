import { auth } from "$lib/services/firebase"
import { writable } from 'svelte/store'

export const user = writable("Loading...")

const unsubscribe = auth.onAuthStateChanged((authUser) => {
  if (authUser) {
    user.set(authUser)
  } else {
    user.set(null)
  }
})

export function cleanup() {
  unsubscribe()
}
