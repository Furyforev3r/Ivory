import { json } from "@sveltejs/kit"
import { toggleFollow } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { targetUID } = await request.json()

    if (!targetUID) {
      return json({ error: 'Missing targetUID' }, { status: 400 })
    }

    const result = await toggleFollow(targetUID, uid, token)

    if (result.success) {
      return json({ following: result.following }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Toggle follow error:", error)
    return json({ error: 'An error occurred while toggling follow' }, { status: 500 })
  }
}
