import { request } from './api.js'
import { debounce } from './util.js'

import LanguagePicker from './language-picker.js'
import LoadingIndicator from './loading-indicator.js'

class App {
  static findRelevantEls(container, title) {
    const anchor = container.querySelector(`[id^='${title}']`)
    if (!anchor) return []
    const result = [anchor.parentElement]
    do {
      let sibling = result[result.length - 1].nextElementSibling
      if (!sibling || sibling.tagName === result[0].tagName) return result
      result.push(sibling)
    } while (true)
  }

  constructor() {
    this.updateHistory = this.updateHistory.bind(this)
    this.handleInputDrop = this.handleInputDrop.bind(this)
    this.handleUrlChange = this.handleUrlChange.bind(this)
    this.handleLanguagesChange = this.handleLanguagesChange.bind(this)
    this.handleContentClick = this.handleContentClick.bind(this)

    this.queryAbortController = null

    this.inputEl = document.querySelector('input')
    this.contentEl = document.getElementById('content')
    this.languagePickerEl = document.getElementById('language-picker')
    this.loadingIndicatorEl = document.getElementById('loading-indicator')
    this.messageEl = document.getElementById('message')

    this.inputEl.addEventListener('input', debounce(this.updateHistory, 250))
    this.inputEl.addEventListener('drop', this.handleInputDrop)
    this.languagePickerEl.addEventListener('change', this.handleLanguagesChange)
    this.contentEl.addEventListener('click', this.handleContentClick)

    window.addEventListener('popstate', this.handleUrlChange)

    this.handleUrlChange()
    if (!this.inputEl.value) {
      this.messageEl.innerHTML = `<p>Search for a word or phrase</p><p>(and select some languages)</p>`
      this.contentEl.innerHTML = ''
      this.contentEl.appendChild(this.messageEl)
    }
    this.loadLanguages().then(() => this.load())
  }

  async loadLanguages() {
    const data = await request({
      action: 'sitematrix',
      smtype: 'language',
      smsiteprop: 'code'
    })

    const languages = Object.values(data.sitematrix)
      .filter(
        lang =>
          lang.localname &&
          lang.site &&
          lang.site.find(site => site.code === 'wiktionary')
      )
      .map(lang => ({
        code: lang.code,
        name: lang.localname
      }))

    this.languagePickerEl.languages = languages
    this.restoreSelectedLanguages()
  }

  restoreSelectedLanguages() {
    try {
      const selectedLanguageCodes = JSON.parse(
        localStorage.getItem(`selectedLanguages`)
      )
      const selectedLanguages = selectedLanguageCodes
        .map(code =>
          this.languagePickerEl.languages.find(lang => lang.code === code)
        )
        .filter(lang => !!lang)
      this.languagePickerEl.selectedLanguages = selectedLanguages
    } catch (e) {
      // TOOD: Handle?
    }
  }

  async load() {
    const search = this.inputEl.value
    if (!search) return

    if (this.request) this.request.cancel()

    const q = search.replace(/ /g, '_')

    try {
      if (this.loadingIndicatorEl.parentNode !== this.contentEl) {
        this.contentEl.innerHTML = ''
        this.contentEl.appendChild(this.loadingIndicatorEl)
      }
      this.request = request({ action: 'parse', prop: 'text', page: q })
      const data = await this.request
      if (data.error) {
        this.messageEl.innerText = data.error.info
        this.contentEl.innerHTML = ''
        this.contentEl.appendChild(this.messageEl)
        return
      }
      this.sourceHtml = data.parse.text['*']
      this.updateContent()
    } catch (err) {
      if (err.name === 'AbortError') return
      throw err
    }
  }

  updateContent() {
    if (!this.sourceHtml) return
    this.contentEl.innerHTML = this.sourceHtml

    const els = this.languagePickerEl.selectedLanguages
      .map(l =>
        this.constructor.findRelevantEls(
          this.contentEl,
          l.name.replace(/ /, '_')
        )
      )
      .flat()

    if (els.length !== 0) {
      this.contentEl.innerHTML = els.map(e => e.outerHTML).join('')
    }
  }

  handleContentClick(e) {
    const el = e.target.closest('a')

    if (!el) return
    if (el.getAttribute('href').startsWith('#')) return

    this.inputEl.value = decodeURIComponent(
      el.href.replace(/.*?\/wiki\/(.*?)(#.*)?$/g, '$1').replace(/_/g, ' ')
    )
    this.updateHistory()
    e.preventDefault()
  }

  handleUrlChange() {
    const url = new URL(document.location)
    const q = url.searchParams.get('q')
    if (q === this.inputEl.value.trim()) return

    this.inputEl.value = q
    if (!this.languagePickerEl.languages.length) return

    this.load()
  }

  handleInputDrop() {
    this.inputEl.value = e.dataTransfer.getData('text/plain')
    this.updateHistory()
  }

  handleLanguagesChange() {
    this.updateContent()
    try {
      window.localStorage.selectedLanguages = JSON.stringify(
        this.languagePickerEl.selectedLanguages.map(lang => lang.code)
      )
    } catch (err) {
      console.warn("Couldn't save selected languages", err)
      // TODO: Do something?
    }
  }

  updateHistory() {
    const url = new URL(window.location)
    url.searchParams.set('q', this.inputEl.value.trim())
    history.pushState(null, null, url.toString())
    this.load()
  }
}

window.app = new App()
