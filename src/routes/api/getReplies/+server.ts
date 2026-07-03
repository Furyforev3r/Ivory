import { json } from "@sveltejs/kit"
import { getReplies } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const postUID = url.searchParams.get('postUID')
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 20

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await getReplies(postUID, limit)

    if (result.success) {
      return json({ replies: result.replies }, { status: 200 })
    } else {
      return json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Get replies error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
