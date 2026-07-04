import { json } from "@sveltejs/kit"
import { getPostByUID } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const postUID = url.searchParams.get('uid')
    const viewerUID = url.searchParams.get('viewerUID')

    const result = await getPostByUID(postUID, viewerUID)

    if (result.success) {
      return json({ post: result.post }, { status: 200 })
    } else if (result.private) {
      return json({ error: 'This post is private', private: true }, { status: 403 })
    } else {
      return json({ error: 'No posts found for this UID' }, { status: 404 })
    }
  } catch (error) {
    console.error("Get post error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
