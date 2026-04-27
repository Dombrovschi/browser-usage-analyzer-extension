import { Tracker } from './lib/tracker.js'
import { addTime } from './lib/storage.js'
import { extractDomain } from './lib/utils.js'

const tracker = new Tracker()
const TICK_INTERVAL = 1 / 30
const MAX_SANE_ELAPSED = 5000

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('tracker-tick', { periodInMinutes: TICK_INTERVAL })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tracker-tick') flush()
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  trackDomain(extractDomain(tab.url))
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) trackDomain(extractDomain(tab.url))
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    flush()
    tracker.stop()
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) trackDomain(extractDomain(tab.url))
    })
  }
})

function flush() {
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
  } else {
    tracker.stop()
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) trackDomain(extractDomain(tab.url))
})
