// Memoized variable highlighting
const highlightCache = new Map<string, string>()

export const highlightVariables = (text: string) => {
  if (highlightCache.has(text)) {
    return highlightCache.get(text)!
  }
  const highlighted = text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
  highlightCache.set(text, highlighted)
  return highlighted
}

export const extractVariables = (content: string): string[] => {
  const matches = content.match(/\{\{([^}]+)\}\}/g)
  // Remove duplicates by using a Set
  const uniqueMatches = matches ? Array.from(new Set(matches.map(match => match.replace(/[{}]/g, '')))) : []
  return uniqueMatches
}

export const estimateTokens = (content: string): number => {
  // Simple token estimation: roughly 4 characters per token
  return Math.ceil(content.length / 4)
}

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}