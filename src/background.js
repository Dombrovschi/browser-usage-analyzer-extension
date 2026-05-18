import { Tracker } from './lib/tracker.js'
import { addTime, getDailyData, getBonusTime, getSiteLimits, setSiteLimit, addBonusTime, getBlockedSites } from './lib/storage.js'
import { extractDomain } from './lib/utils.js'

const tracker = new Tracker()
const TICK_INTERVAL = 1 / 30
const MAX_SANE_ELAPSED = 5000
const BONUS_MS = 300000

let syncingRules = false

async function syncBlockRules() {
  if (syncingRules) return
  syncingRules = true
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const existingIds = existingRules.map(r => r.id)

    const blockedSites = await getBlockedSites()
    if (blockedSites.length === 0 && existingIds.length === 0) return

    const extensionId = chrome.runtime.id
    const newRules = blockedSites.map((domain, i) => {
      const escapedDomain = domain.replace(/\./g, '\\.')
      return {
        id: 100 + i,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            regexSubstitution: `chrome-extension://${extensionId}/src/blocked/index.html?domain=${domain}`,
          },
        },
        condition: {
          regexFilter: `^https?://((?:[^/?#]+\\.)*${escapedDomain})(?:/.*)?$`,
          isUrlFilterCaseSensitive: false,
          resourceTypes: ['main_frame'],
        },
      }
    })

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: newRules,
    })
  } finally {
    syncingRules = false
  }
}

syncBlockRules()

let currentTabId = null
let currentTabVisible = true
const blockedDomains = new Set()
const warnedThresholds = {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('tracker-tick', { periodInMinutes: TICK_INTERVAL })
  syncBlockRules()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockedSites) {
    syncBlockRules()
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tracker-tick') {
    flush()
    checkCurrentLimits()
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  currentTabId = tabId
  currentTabVisible = true
  const tab = await chrome.tabs.get(tabId)
  trackDomain(extractDomain(tab.url))
  chrome.tabs.sendMessage(tabId, { type: 'GET_VISIBILITY' }, (response) => {
    if (chrome.runtime.lastError) return
    if (response) currentTabVisible = response.visible
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tabId === currentTabId) {
    trackDomain(extractDomain(tab.url))
  }
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    flush()
    tracker.stop()
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        currentTabId = tab.id
        trackDomain(extractDomain(tab.url))
      }
    })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VISIBILITY_CHANGE') {
    const tabId = sender.tab?.id
    if (tabId && tabId === currentTabId) {
      currentTabVisible = message.visible
      if (!message.visible) {
        flush()
        tracker.stop()
      } else if (!tracker.getActiveDomain()) {
        chrome.tabs.get(tabId, (tab) => {
          if (tab && tab.id === currentTabId) {
            trackDomain(extractDomain(tab.url))
          }
        })
      }
    }
    return
  }

  if (message.type === 'ADD_BONUS_TIME') {
    addBonusTime(message.domain, message.ms).then(() => {
      blockedDomains.delete(message.domain)
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'HIDE_BLOCK' })
      }
    })
    return true
  }

  if (message.type === 'SET_LIMIT') {
    setSiteLimit(message.domain, message.config).then(() => {
      sendResponse({ ok: true })
    })
    return true
  }

  if (message.type === 'GET_LIMITS') {
    getSiteLimits().then((limits) => {
      sendResponse(limits)
    })
    return true
  }
})

function flush() {
  if (!currentTabVisible) return
  const domain = tracker.getActiveDomain()
  if (!domain) return
  const ms = tracker.tick()
  if (ms > 0 && ms <= MAX_SANE_ELAPSED) {
    addTime(domain, ms)
  }
}

function trackDomain(domain) {
  if (domain === tracker.getActiveDomain()) return
  flush()
  if (domain) {
    tracker.start(domain)
    checkLimits(domain, currentTabId)
  } else {
    tracker.stop()
  }
}

async function checkLimits(domain, tabId) {
  if (!domain || !tabId) return
  const limits = await getSiteLimits()
  const limit = limits[domain]
  if (!limit || !limit.enabled) return

  const today = new Date().toISOString().split('T')[0]
  const [dailyData, bonusData] = await Promise.all([getDailyData(), getBonusTime()])
  const dailyMs = dailyData[today]?.[domain] || 0
  const bonusMs = bonusData[today]?.[domain] || 0
  const effectiveLimit = limit.dailyLimitMs + bonusMs

  if (dailyMs < effectiveLimit && limit.warningThresholdsMs) {
    if (!warnedThresholds[domain]) warnedThresholds[domain] = new Set()
    for (const threshold of limit.warningThresholdsMs) {
      if (dailyMs >= threshold && !warnedThresholds[domain].has(threshold)) {
        warnedThresholds[domain].add(threshold)
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_WARNING',
          domain,
          usedMs: dailyMs,
          limitMs: limit.dailyLimitMs,
        }).catch(() => {})
      }
    }
  }

  if (dailyMs >= effectiveLimit && !blockedDomains.has(domain)) {
    blockedDomains.add(domain)
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_BLOCK',
      domain,
      usedMs: dailyMs,
      limitMs: limit.dailyLimitMs,
    }).catch(() => {})
  }
}

async function checkCurrentLimits() {
  await checkLimits(tracker.getActiveDomain(), currentTabId)
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) {
    currentTabId = tab.id
    trackDomain(extractDomain(tab.url))
  }
})
