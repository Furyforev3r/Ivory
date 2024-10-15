import { json } from "@sveltejs/kit"
import { newPost } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const newPostInfo = await request.json()

    const post = await newPost(newPostInfo, token)

    if (post.success) {
      return json({ message: 'Post made successfully' }, { status: 201 })
    } else {
      return json({ error: 'Failed to post' }, { status: 409 })
    }
  } catch (error) {
    console.error("Error making the post:", error)
    return json({ error: 'An error occurred during making the post' }, { status: 500 })
  }
}
