import { auth, googleProvider } from "$lib/services/firebase"
import { signInWithPopup, signOut } from "firebase/auth"

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    return { success: true, user }
  } catch (error) {
    return { success: false, error }
  }
}

export async function logout() {
  await signOut(auth)
}
