import { json } from "@sveltejs/kit"
import { uploadUserImage } from "$lib/server/utils/firebaseAdminUtils"

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const MAX_VIDEO_SIZE = 4 * 1024 * 1024

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
      return json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.includes(file.type)
    const isVideo = kind === 'post' && VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return json({ error: 'Unsupported media type' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

    if (file.size > maxSize) {
      return json({ error: isVideo ? 'Video is too large (max 4MB)' : 'Image is too large (max 8MB)' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadUserImage(uid, token, kind, buffer, file.type)

    if (result.success) {
      return json({ url: result.url, isVideo, isGif: file.type === 'image/gif' }, { status: 200 })
    } else {
      return json({ error: result.message || result.error }, { status: 403 })
    }
  } catch (error) {
    console.error("Upload image error:", error)
    return json({ error: 'An error occurred during upload' }, { status: 500 })
  }
}
