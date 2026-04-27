import { todayString } from './utils.js'

export const STORAGE_KEYS = {
  DAILY_DATA: 'dailyData',
  SITE_LIMITS: 'siteLimits',
  BONUS_TIME: 'bonusTime',
  BLOCKED_SITES: 'blockedSites',
  SETTINGS: 'settings',
}

export async function getDailyData() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_DATA)
  return result[STORAGE_KEYS.DAILY_DATA] || {}
}

export async function addTime(domain, ms) {
  const key = STORAGE_KEYS.DAILY_DATA
  const result = await chrome.storage.local.get(key)
  const data = result[key] || {}
  const today = todayString()
  if (!data[today]) data[today] = {}
  data[today][domain] = (data[today][domain] || 0) + ms
  await chrome.storage.local.set({ [key]: data })
}

export async function getDomainTime(domain) {
  const today = todayString()
  const [dailyData, bonusData] = await Promise.all([
    getDailyData(),
    getBonusTime(),
  ])
  const daily = dailyData[today]?.[domain] || 0
  const bonus = bonusData[today]?.[domain] || 0
  return daily + bonus
}

export async function getSiteLimits() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_LIMITS)
  return result[STORAGE_KEYS.SITE_LIMITS] || {}
}

export async function setSiteLimit(domain, config) {
  const key = STORAGE_KEYS.SITE_LIMITS
  const result = await chrome.storage.local.get(key)
  const data = result[key] || {}
  data[domain] = config
  await chrome.storage.local.set({ [key]: data })
}

export async function removeSiteLimit(domain) {
  const key = STORAGE_KEYS.SITE_LIMITS
  const result = await chrome.storage.local.get(key)
  const data = result[key] || {}
  delete data[domain]
  await chrome.storage.local.set({ [key]: data })
}

export async function getBonusTime() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BONUS_TIME)
  return result[STORAGE_KEYS.BONUS_TIME] || {}
}

export async function addBonusTime(domain, ms) {
  const key = STORAGE_KEYS.BONUS_TIME
  const result = await chrome.storage.local.get(key)
  const data = result[key] || {}
  const today = todayString()
  if (!data[today]) data[today] = {}
  data[today][domain] = (data[today][domain] || 0) + ms
  await chrome.storage.local.set({ [key]: data })
}

export async function getBlockedSites() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_SITES)
  return result[STORAGE_KEYS.BLOCKED_SITES] || []
}

export async function setBlockedSites(sites) {
  await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_SITES]: sites })
}

export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  return result[STORAGE_KEYS.SETTINGS] || {
    defaultWarningThresholdsMs: [300000],
    storageVersion: 1,
  }
}
