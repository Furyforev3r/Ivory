import { json } from "@sveltejs/kit"
import { toggleBookmark } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID } = await request.json()

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await toggleBookmark(postUID, uid, token)

    if (result.success) {
      return json({ bookmarked: result.bookmarked }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error)
    return json({ error: 'An error occurred while toggling the bookmark' }, { status: 500 })
  }
}
