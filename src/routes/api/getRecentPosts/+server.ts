import { json } from "@sveltejs/kit"
import { getRecentPosts } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const limitParam = url.searchParams.get('limit')
    const limit = parseInt(limitParam)

    const posts = await getRecentPosts(limit)

    if (posts.success) {
      return json({ posts: posts }, { status: 200 })
    } else {
      return json({ error: 'Posts not found' }, { status: 404 })
    }
  } catch (error) {
    console.error("Get posts error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
