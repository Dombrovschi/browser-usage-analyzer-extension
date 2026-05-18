const params = new URLSearchParams(window.location.search)
const domain = params.get('domain')

const domainEl = document.getElementById('domain-name')
if (domain) {
  domainEl.textContent = domain
} else {
  domainEl.remove()
}

document.getElementById('go-back').addEventListener('click', () => {
  history.back()
})
