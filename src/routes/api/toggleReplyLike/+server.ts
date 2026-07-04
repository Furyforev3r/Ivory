import { json } from "@sveltejs/kit"
import { toggleReplyLike } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { replyUID } = await request.json()

    if (!replyUID) {
      return json({ error: 'Missing replyUID' }, { status: 400 })
    }

    const result = await toggleReplyLike(replyUID, uid, token)

    if (result.success) {
      return json({ liked: result.liked }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Toggle reply like error:", error)
    return json({ error: 'An error occurred while toggling like' }, { status: 500 })
  }
}
