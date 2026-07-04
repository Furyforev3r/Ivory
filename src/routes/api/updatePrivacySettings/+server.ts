import { json } from "@sveltejs/kit"
import { updatePrivacySettings } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const settingsUpdate = await request.json()

    const result = await updatePrivacySettings(uid, token, settingsUpdate)

    if (result.success) {
      return json({ message: 'Privacy settings updated' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Update privacy settings error:", error)
    return json({ error: 'An error occurred while updating privacy settings' }, { status: 500 })
  }
}
