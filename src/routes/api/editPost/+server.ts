import { json } from "@sveltejs/kit"
import { editPost } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID, content } = await request.json()

    if (!postUID || !content) {
      return json({ error: 'Missing postUID or content' }, { status: 400 })
    }

    const result = await editPost(postUID, uid, content, token)

    if (result.success) {
      return json({ post: result.post }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Edit post error:", error)
    return json({ error: 'An error occurred while editing the post' }, { status: 500 })
  }
}
