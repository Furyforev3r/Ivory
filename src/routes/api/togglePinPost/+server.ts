import { json } from "@sveltejs/kit"
import { togglePinPost } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID } = await request.json()

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await togglePinPost(uid, postUID, token)

    if (result.success) {
      return json({ pinnedPostUID: result.pinnedPostUID }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Toggle pin post error:", error)
    return json({ error: 'An error occurred while updating the pinned post' }, { status: 500 })
  }
}
