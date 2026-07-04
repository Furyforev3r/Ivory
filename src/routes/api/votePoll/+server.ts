import { json } from "@sveltejs/kit"
import { votePoll } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { postUID, optionIndex } = await request.json()

    if (!postUID || optionIndex === undefined) {
      return json({ error: 'Missing postUID or optionIndex' }, { status: 400 })
    }

    const result = await votePoll(postUID, uid, optionIndex, token)

    if (result.success) {
      return json({ options: result.options }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Vote poll error:", error)
    return json({ error: 'An error occurred while voting' }, { status: 500 })
  }
}
