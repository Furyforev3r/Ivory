import { json } from "@sveltejs/kit"
import { db } from "$lib/server/services/firebaseAdmin"
import { registerUser } from "$lib/server/utils/firebaseAdminUtils"

function validateUserInput(user) {
  const { uid, displayName, email } = user
  if (!uid || !displayName || !email) {
    throw new Error("Missing required fields")
  }
}

export async function POST({ request }) {
  try {
    const newUser = await request.json()
    validateUserInput(newUser)

    const register = await registerUser(newUser)

    if (register.success) {
      return json({ message: 'User added successfully' }, { status: 201 })
    } else {
      return json({ error: 'User already exists' }, { status: 409 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}
