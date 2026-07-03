import { json } from "@sveltejs/kit"
import { markNotificationsSeen } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')

    const result = await markNotificationsSeen(uid, token)

    if (result.success) {
      return json({ message: 'Notifications marked as seen' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Mark notifications seen error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
