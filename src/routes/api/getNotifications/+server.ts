import { json } from "@sveltejs/kit"
import { getNotifications } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 30

    const result = await getNotifications(uid, token, limit)

    if (result.success) {
      return json({ notifications: result.notifications, lastRead: result.lastRead }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Get notifications error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
