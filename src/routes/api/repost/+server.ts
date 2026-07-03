import { json } from "@sveltejs/kit"
import { createRepost, removeRepost } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID, quote } = await request.json()

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await createRepost(postUID, quote, uid, token)

    if (result.success) {
      return json({ id: result.id }, { status: 201 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Repost error:", error)
    return json({ error: 'An error occurred while reposting' }, { status: 500 })
  }
}

export async function DELETE({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const postUID = url.searchParams.get('postUID')

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await removeRepost(postUID, uid, token)

    if (result.success) {
      return json({ message: 'Repost removed' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Remove repost error:", error)
    return json({ error: 'An error occurred while removing repost' }, { status: 500 })
  }
}
