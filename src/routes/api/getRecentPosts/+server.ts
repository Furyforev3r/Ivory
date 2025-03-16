import { json } from "@sveltejs/kit"
import { getRecentPosts } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const limitParam = url.searchParams.get('limit')
    const pageParam = url.searchParams.get('page')
    const limit = parseInt(limitParam)
    const page = parseInt(pageParam)

    const posts = await getRecentPosts(limit, page)

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
