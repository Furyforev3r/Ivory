import { json } from "@sveltejs/kit"
import { adminEditUserProfile } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const adminUID = url.searchParams.get('adminUID')
    const { targetUID, ...updatedUserData } = await request.json()

    if (!targetUID) {
      return json({ error: 'Missing targetUID' }, { status: 400 })
    }

    const result = await adminEditUserProfile(adminUID, targetUID, updatedUserData, token)

    if (result.success) {
      return json({ message: result.message }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Admin edit user error:", error)
    return json({ error: 'An error occurred while updating the user' }, { status: 500 })
  }
}
