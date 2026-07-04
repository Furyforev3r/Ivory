import { json } from "@sveltejs/kit"
import { updateAccountPrivacy } from "$lib/server/utils/firebaseAdminUtils"

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const { isPrivate } = await request.json()

    const result = await updateAccountPrivacy(uid, token, !!isPrivate)

    if (result.success) {
      return json({ message: 'Account privacy updated' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Update account privacy error:", error)
    return json({ error: 'An error occurred while updating account privacy' }, { status: 500 })
  }
}
