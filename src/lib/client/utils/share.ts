export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url })
      return "shared"
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return "failed"
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return "copied"
  } catch (error) {
    return "failed"
  }
}
