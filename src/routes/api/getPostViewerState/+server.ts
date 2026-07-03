import { json } from "@sveltejs/kit"
import { getPostViewerState } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const postUID = url.searchParams.get('postUID')
    const uid = url.searchParams.get('uid')

    if (!postUID) {
      return json({ error: 'Missing postUID' }, { status: 400 })
    }

    const result = await getPostViewerState(postUID, uid)

    if (result.success) {
      return json({ liked: result.liked, reposted: result.reposted }, { status: 200 })
    } else {
      return json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Get post viewer state error:", error)
    return json({ error: 'An error occurred' }, { status: 500 })
  }
}
