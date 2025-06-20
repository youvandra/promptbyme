// Memoized date formatter to avoid repeated calculations
const dateCache = new Map<string, string>()

export const formatDate = (dateString: string) => {
  if (dateCache.has(dateString)) {
    return dateCache.get(dateString)!
  }
  const formatted = new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  dateCache.set(dateString, formatted)
  return formatted
}

// Memoized view formatter to avoid repeated calculations
const viewCache = new Map<number, string>()

export const formatViews = (count: number) => {
  if (viewCache.has(count)) {
    return viewCache.get(count)!
  }
  let formatted: string
  if (count === 0) formatted = '0'
  else if (count < 1000) formatted = count.toString()
  else if (count < 1000000) formatted = `${(count / 1000).toFixed(1)}k`
  else formatted = `${(count / 1000000).toFixed(1)}M`
  
  viewCache.set(count, formatted)
  return formatted
}

// Memoized content truncation
const truncateCache = new Map<string, string>()

export const truncateText = (text: string, maxLength: number = 200) => {
  const cacheKey = `${text.length}-${maxLength}`
  if (truncateCache.has(cacheKey)) {
    return truncateCache.get(cacheKey)!
  }
  const truncated = text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
  truncateCache.set(cacheKey, truncated)
  return truncated
}

export const formatNumber = (num: number) => {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
  return `${(num / 1000000).toFixed(1)}M`
}