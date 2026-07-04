import { json } from "@sveltejs/kit"
import { respondFollowRequest } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { requesterUID, accept } = await request.json()

    if (!requesterUID) {
      return json({ error: 'Missing requesterUID' }, { status: 400 })
    }

    const result = await respondFollowRequest(uid, requesterUID, !!accept, token)

    if (result.success) {
      return json({ message: 'Follow request updated' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Respond follow request error:", error)
    return json({ error: 'An error occurred while responding to the follow request' }, { status: 500 })
  }
}
