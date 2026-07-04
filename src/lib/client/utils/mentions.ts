export type ContentToken = { type: "text" | "mention"; value: string }

export function tokenizeMentions(content: string): ContentToken[] {
  if (!content) return []

  const tokens: ContentToken[] = []
  const regex = /@(\w+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, match.index) })
    }
    tokens.push({ type: "mention", value: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) })
  }

  return tokens
}
