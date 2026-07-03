import { json } from "@sveltejs/kit"
import { uploadUserImage } from "$lib/server/utils/firebaseAdminUtils"

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST({ url, request }) {
  try {
    const token = url.searchParams.get('token')
    const uid = url.searchParams.get('uid')
    const kind = url.searchParams.get('kind')

    if (!token || !uid || !kind) {
      return json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return json({ error: 'No image provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Unsupported image type' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return json({ error: 'Image is too large' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadUserImage(uid, token, kind, buffer, file.type)

    if (result.success) {
      return json({ url: result.url }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Upload image error:", error)
    return json({ error: 'An error occurred during upload' }, { status: 500 })
  }
}
