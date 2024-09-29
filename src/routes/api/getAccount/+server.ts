import { json } from "@sveltejs/kit"
import { getUserByUsername } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const username = url.searchParams.get('username')

    const userInfo = await getUserByUsername(username)

    if (userInfo.success) {
      return json({ user: userInfo.user }, { status: 200 })
    } else {
      return json({ error: 'User not found' }, { status: 404 })
    }
  } catch (error) {
    console.error("Get user error:", error)
    return json({ error: 'An error occurred during get' }, { status: 500 })
  }
}
