import { json } from "@sveltejs/kit"
import { getFollowRequests } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')

    const result = await getFollowRequests(uid, token)

    if (result.success) {
      return json({ requests: result.requests }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Get follow requests error:", error)
    return json({ error: 'An error occurred while fetching follow requests' }, { status: 500 })
  }
}
