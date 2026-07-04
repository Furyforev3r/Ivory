import { json } from "@sveltejs/kit"
import { deletePost } from "$lib/server/utils/firebaseAdminUtils"

export async function DELETE({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const postUID = url.searchParams.get('postUID')

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await deletePost(postUID, uid, token)

    if (result.success) {
      return json({ message: 'Post deleted' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Delete post error:", error)
    return json({ error: 'An error occurred while deleting the post' }, { status: 500 })
  }
}
