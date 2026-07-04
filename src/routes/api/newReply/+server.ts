import { json } from "@sveltejs/kit"
import { newReply } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID, content, parentReplyUID } = await request.json()

    if (!postUID || !content || !content.trim()) {
      return json({ error: 'Missing postUID or content' }, { status: 400 })
    }

    const result = await newReply(postUID, content, uid, token, parentReplyUID ?? null)

    if (result.success) {
      return json({ id: result.id }, { status: 201 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("New reply error:", error)
    return json({ error: 'An error occurred while replying' }, { status: 500 })
  }
}
