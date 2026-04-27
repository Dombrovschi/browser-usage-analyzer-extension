export class Tracker {
  constructor() {
    this.activeDomain = null
    this.sessionStart = null
  }

  start(domain) {
    this.stop()
    this.activeDomain = domain
    this.sessionStart = Date.now()
  }

  stop() {
    this.activeDomain = null
    this.sessionStart = null
  }

  tick() {
    const elapsed = this.getElapsed()
    this.sessionStart = Date.now()
    return elapsed
  }

  getElapsed() {
    if (!this.sessionStart) return 0
    return Date.now() - this.sessionStart
  }

  getActiveDomain() {
    return this.activeDomain
  }
}
