import { json } from "@sveltejs/kit"
import { getPostsByUserUID } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const userUID = url.searchParams.get('userUID')
    const limitParam = url.searchParams.get('limit')
    const limit = parseInt(limitParam)

    const posts = await getPostsByUserUID(userUID, limit)

    if (posts.success) {
      return json({ posts: posts }, { status: 200 })
    } else {
      return json({ error: 'No posts found for this user' }, { status: 404 })
    }
  } catch (error) {
    console.error("Get posts error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
