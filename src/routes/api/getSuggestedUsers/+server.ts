import { json } from "@sveltejs/kit"
import { getSuggestedUsers } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const uid = url.searchParams.get('uid')
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 3

    const result = await getSuggestedUsers(uid, limit)

    if (result.success) {
      return json({ users: result.users }, { status: 200 })
    } else {
      return json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Get suggested users error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
