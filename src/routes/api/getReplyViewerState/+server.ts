import { json } from "@sveltejs/kit"
import { getReplyViewerState } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const replyUID = url.searchParams.get('replyUID')
    const uid = url.searchParams.get('uid')

    if (!replyUID) {
      return json({ error: 'Missing replyUID' }, { status: 400 })
    }

    const result = await getReplyViewerState(replyUID, uid)

    if (result.success) {
      return json({ liked: result.liked }, { status: 200 })
    } else {
      return json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Get reply viewer state error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
