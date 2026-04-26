import { getDailyData } from '../lib/storage.js'
import { formatDuration, todayString } from '../lib/utils.js'

async function init() {
  const data = await getDailyData()
  const today = data[todayString()] || {}
  const entries = Object.entries(today).sort((a, b) => b[1] - a[1])

  const total = Object.values(today).reduce((sum, ms) => sum + ms, 0)

  const statsEl = document.getElementById('stats')
  if (entries.length === 0) {
    statsEl.innerHTML = '<p>No browsing data recorded yet today.</p>'
    return
  }

  statsEl.innerHTML = `
    <p><strong>Total today:</strong> ${formatDuration(total)}</p>
    <p><strong>Sites visited:</strong> ${entries.length}</p>
    <ul>
      ${entries.map(([site, ms]) =>
        `<li><strong>${site}</strong>: ${formatDuration(ms)}</li>`
      ).join('')}
    </ul>
  `
}

init()
