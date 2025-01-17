/**
 * Measure how long a callback takes to execute.
 * Returns the response from the callback
 * The measured duration is returned via the onDuration callback
 */
export function measure(callback, onDuration) {
  const start = Date.now()
  const result = callback()
  const end = Date.now()

  onDuration(end - start)

  return result
}
