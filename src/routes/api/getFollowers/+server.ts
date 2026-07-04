import { json } from "@sveltejs/kit"
import { getFollowers } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const targetUID = url.searchParams.get('targetUID')
    const requesterUID = url.searchParams.get('uid')

    if (!targetUID) {
      return json({ error: 'Missing targetUID' }, { status: 400 })
    }

    const result = await getFollowers(targetUID, requesterUID)

    if (result.success) {
      return json({ users: result.users }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Get followers error:", error)
    return json({ error: 'An error occurred while fetching followers' }, { status: 500 })
  }
}
