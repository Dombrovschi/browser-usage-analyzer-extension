import { getDailyData } from '../lib/storage.js'
import { extractDomain, formatDuration, todayString } from '../lib/utils.js'

async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tabs[0]?.url
  const domain = extractDomain(url)

  document.getElementById('current-site').textContent = domain || 'No site detected'

  if (domain) {
    const data = await getDailyData()
    const today = data[todayString()] || {}
    const ms = today[domain] || 0
    document.getElementById('time-spent').textContent =
      `Time today: ${formatDuration(ms)}`
  }
}

document.getElementById('open-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') })
})

init()
