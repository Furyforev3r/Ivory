import { json } from "@sveltejs/kit"
import { editUserProfile } from "$lib/server/utils/firebaseAdminUtils"

export async function PUT({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const newProfile = await request.json()

    const profileEdit = await editUserProfile(uid, newProfile, token)

    if (profileEdit.success) {
      return json({ message: "Profile updated successfully" }, { status: 200 })
    } else {
      return json({ error: profileEdit }, { status: 404 })
    }
  } catch (error) {
    console.error("Edit profile error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
