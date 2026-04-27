function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

const STYLE_ID = '__bua-styles'

const styles = `
#__bua-overlay {
  all: initial;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
}

.__bua-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 40px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.__bua-icon {
  font-size: 56px;
  margin-bottom: 16px;
  line-height: 1;
}

.__bua-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.__bua-domain {
  font-size: 16px;
  color: #4f46e5;
  font-weight: 600;
  margin: 0 0 20px;
}

.__bua-text {
  font-size: 14px;
  color: #666;
  margin: 6px 0;
  line-height: 1.5;
}

.__bua-text strong {
  color: #333;
}

#__bua-add-time {
  display: inline-block;
  margin-top: 24px;
  padding: 12px 36px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

#__bua-add-time:hover {
  background: #4338ca;
}
`

let overlay = null

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = styles
  document.head.appendChild(style)
}

function showBlockOverlay({ domain, usedMs, limitMs }) {
  if (overlay) return
  injectStyles()

  overlay = document.createElement('div')
  overlay.id = '__bua-overlay'
  overlay.innerHTML = `
    <div class="__bua-card">
      <div class="__bua-icon">⏰</div>
      <h1 class="__bua-title">Time's up!</h1>
      <p class="__bua-domain">${escapeHtml(domain)}</p>
      <p class="__bua-text">You've spent <strong>${formatDuration(usedMs)}</strong> today.</p>
      <p class="__bua-text">Your daily limit is <strong>${formatDuration(limitMs)}</strong>.</p>
      <button id="__bua-add-time">+5 more minutes</button>
    </div>
  `

  document.body.appendChild(overlay)

  document.getElementById('__bua-add-time').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'ADD_BONUS_TIME', domain, ms: 300000 })
  })
}

function hideBlockOverlay() {
  if (overlay) {
    overlay.remove()
    overlay = null
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SHOW_BLOCK':
      showBlockOverlay(message)
      break
    case 'HIDE_BLOCK':
      hideBlockOverlay()
      break
  }
})
