import { json } from "@sveltejs/kit"
import { getPostNotificationStatus } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const targetUID = url.searchParams.get('targetUID')
    const uid = url.searchParams.get('uid')

    if (!targetUID) {
      return json({ error: 'Missing targetUID' }, { status: 400 })
    }

    const result = await getPostNotificationStatus(targetUID, uid)

    if (result.success) {
      return json({ subscribed: result.subscribed }, { status: 200 })
    } else {
      return json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Get post notification status error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
