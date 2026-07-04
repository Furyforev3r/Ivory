import { json } from "@sveltejs/kit"
import { getBookmarkedPosts } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const limit = Number(url.searchParams.get('limit')) || 30

    const result = await getBookmarkedPosts(uid, token, limit)

    if (result.success) {
      return json({ posts: result.posts }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Get bookmarks error:", error)
    return json({ error: 'An error occurred while fetching bookmarks' }, { status: 500 })
  }
}
