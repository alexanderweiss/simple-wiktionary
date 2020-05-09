const apiUrl = 'https://en.wiktionary.org/w/api.php'

export function request(params) {
  const abortController = new AbortController()
  const qs = new URLSearchParams({
    format: 'json',
    origin: '*',
    ...params
  }).toString()

  const promise = fetch(`${apiUrl}?${qs}`, {
    signal: abortController.signal
  }).then(res => res.json())

  promise.cancel = function() {
    abortController.abort()
  }

  return promise
}
