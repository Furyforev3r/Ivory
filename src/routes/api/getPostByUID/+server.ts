import { json } from "@sveltejs/kit"
import { getPostByUID } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const postUID = url.searchParams.get('uid')
    
    const post = await getPostByUID(postUID)
    
    if (post.success) {
      return json({ post: post }, { status: 200 })
    } else {
      return json({ error: 'No posts found for this UID' }, { status: 404 })
    }
  } catch (error) {
    console.error("Get post error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
