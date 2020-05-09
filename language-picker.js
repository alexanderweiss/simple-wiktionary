import { LitElement, html, css, svg } from 'lit-element'
import { classMap } from 'lit-html/directives/class-map'
import { repeat } from 'lit-html/directives/repeat.js'
import { cache } from 'lit-html/directives/cache.js'

export default class LanguagePicker extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        height: auto;

        --popoverBorderRadius: calc(1rem - 1px);
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;

        font-size: inherit;
      }

      .button {
        overflow: hidden;
        flex-shrink: 1;

        margin: 0;
        padding: 0.7rem 1.4rem;

        white-space: nowrap;
        text-overflow: ellipsis;

        background: var(--backgroundColor);

        border: 1px solid var(--borderColor);
        border-radius: 2rem;

        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.05);
        animation: button-in-animation 0.25s ease-out both;
      }

      @keyframes button-in-animation {
        0% {
          opacity: 0;
          transform: translateY(0.5rem);
        }
        100 {
          opacity: 1;
        }
      }

      .button + .button {
        margin-left: 0.25em;
      }

      #container {
        display: grid;
        align-items: center;

        position: relative;

        height: 100%;
      }

      #container > * {
        grid-row: 1;
        position: relative;
      }

      #toggle-button {
        grid-column: 1 / span 2;
        overflow: hidden;

        position: relative;

        width: 100%;
        height: 100%;

        background-color: transparent;

        border: none;
      }

      #toggle-button::before {
        display: block;
        content: '';

        position: absolute;
        top: 0;

        width: 100%;
        height: 100%;

        background-color: transparent;
        background-image: linear-gradient(
          90deg,
          rgba(228, 234, 255, 0) 0%,
          rgb(228, 234, 255) 23%
        );

        border-width: 0 0 1px;
        border-image: linear-gradient(
            90deg,
            rgba(148, 168, 236, 0) 0%,
            rgb(148, 168, 236) 23%
          )
          1;

        opacity: 0;
        transform: translateX(50%);
        transition: all 1s ease-out;
      }

      #container:hover #toggle-button::before,
      #container.active #toggle-button::before {
        opacity: 1;
        transform: translateX(0px);
        transition-duration: 0.2s;
      }

      #toggle-button ~ * {
        pointer-events: none;
      }

      #selected-languages {
        display: flex;
        grid-column: 1;

        padding: 0.5rem;

        min-width: 0;
      }

      #chevron-down {
        grid-column: 2;

        margin: 0.5rem 1.5rem 0.5rem 0.5rem;
      }

      #chevron-down polyline {
        stroke: rgb(178, 178, 178);
        transition: all 1s ease-out;
      }

      #container:hover #chevron-down polyline,
      #container.active #chevron-down polyline {
        stroke: rgb(69, 106, 242);
        transition: all 0.2s ease-out;
      }

      #popover {
        display: grid;
        grid-template-rows: auto 1fr;
        pointer-events: initial;

        position: absolute;
        top: calc(100% - 0.3rem);
        right: 0.5rem;
        z-index: 1;

        height: 50rem;
        max-height: 80vh;

        border: 1px solid var(--borderColor);
        border-radius: var(--popoverBorderRadius);
        box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.04);

        transform-origin: 50% top;
        animation: popover-in-animation 0.15s ease-out both;
      }

      @keyframes popover-in-animation {
        0% {
          opacity: 0;
          transform: translateY(-0.5rem) scale(0.8, 0.8);
        }
        100 {
          opacity: 1;
        }
      }

      #popover::before {
        content: '';
        display: block;

        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;

        width: 100%;
        height: 100%;

        background: rgba(250, 250, 250, 0.8);

        border-radius: var(--popoverBorderRadius);

        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .search-field {
        display: grid;
      }

      .search-field > input {
        grid-area: 1 / 1;
        -webkit-appearance: none;

        margin: 0;
        padding: 0.8rem 1rem 0.8rem 3.15rem;

        background: none;

        border: none;
        border-bottom: 1px solid var(--borderColor);
        border-top-left-radius: var(--popoverBorderRadius);
        border-top-right-radius: var(--popoverBorderRadius);
      }

      .search-field svg {
        grid-area: 1 / 1;
        align-self: center;

        margin-left: 1rem;
      }

      ul {
        overflow: auto;

        margin: 0;
        padding: 0.5rem 0;

        list-style: none;
      }

      .option > button {
        display: block;

        padding: 0.5rem 1rem;

        width: 100%;

        text-align: left;

        background: none;

        border: none;
      }

      .option > button::before {
        display: inline-block;
        content: '';

        width: 1.4rem;
        height: 1.4rem;

        margin-right: 0.75rem;

        vertical-align: bottom;

        border: 1px solid var(--borderColor);
        border-radius: 100%;
        box-shadow: inset 0 1px 5px 0 rgba(0, 0, 0, 0.05);
      }

      .option.active > button::before {
        background-image: url('images/checkmark.svg'),
          linear-gradient(180deg, #4587f2 0%, #456af2 100%);
        background-size: 18px 18px, 100% 100%;

        border-color: transparent;
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.05);
      }
    `
  }

  static get properties() {
    return {
      languages: { type: Array },
      selectedLanguages: { type: Array },
      open: { type: Boolean }
    }
  }

  get languages() {
    return this._languages
  }

  set languages(value) {
    const oldValue = this._languages
    this._languages = value
    this.updateFilteredLanguages()
    this.requestUpdate('languages', oldValue)

    this.selectedLanguages = []
  }

  constructor() {
    super()

    this.handleSearch = this.handleSearch.bind(this)
    this.handleDocumentClick = this.handleDocumentClick.bind(this)

    this.searchString = ''
    this.languages = []
    this.selectedLanguages = []
    this.open = false
  }

  handleToggleOpen() {
    this.open = !this.open

    if (this.open) {
      document.addEventListener('mousedown', this.handleDocumentClick, true)
    } else {
      document.removeEventListener('mousedown', this.handleDocumentClick, true)
    }
  }

  handleSearch(e) {
    this.searchString = e.target.value
    this.updateFilteredLanguages()
    this.requestUpdate()
  }

  handleSelection(language) {
    const index = this.selectedLanguages.indexOf(language)

    if (index === -1) {
      this.selectedLanguages = [...this.selectedLanguages, language]
    } else {
      this.selectedLanguages = this.selectedLanguages.slice()
      this.selectedLanguages.splice(index, 1)
    }

    this.dispatchEvent(new Event('change'))
  }

  handleDocumentClick(e) {
    if (this.contains(e.target)) return

    this.handleToggleOpen()
  }

  updateFilteredLanguages() {
    const searchString = this.normalizeString(this.searchString)
    this.filteredLanguages = this.languages
      .filter(l => this.normalizeString(l.name).includes(searchString))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  normalizeString(str) {
    // Note: we're removing diacritics by splitting them from characters and then
    //       removing all characters from the Combining Diacritical Marks unicode block.
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  render() {
    if (!this.languages.length) return ''

    return html`
      <div
        id="container"
        class=${classMap({
          active: this.open
        })}
      >
        <button id="toggle-button" @click=${this.handleToggleOpen}></button>
        <div id="selected-languages">
          ${this.selectedLanguages.length
            ? html`
                ${repeat(
                  this.selectedLanguages,
                  lang => lang.key,
                  (lang, index) => html`
                    <button class="button language-button">${lang.name}</button>
                  `
                )}
              `
            : html`
                <button class="button language-button">All languages</button>
              `}
        </div>
        <svg id="chevron-down" width="18px" height="18px" viewbox="0 0 18 18">
          <polyline
            points="2 6 9 13 16 6"
            stroke="#B2B2B2"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></polyline>
        </svg>
        ${cache(
          this.open
            ? html`
                <div id="popover">
                  <div class="search-field">
                    <input type="text" @input=${this.handleSearch} />
                    <svg height="18" viewBox="0 0 18 18" width="18">
                      <path
                        d="m8 13c2.7614237 0 5-2.2385763 5-5 0-2.76142375-2.2385763-5-5-5-2.76142375 0-5 2.23857625-5 5 0 2.7614237 2.23857625 5 5 5zm4-1 4 4"
                        fill="none"
                        stroke="#999"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  </div>
                  <ul>
                    ${repeat(
                      this.filteredLanguages,
                      lang => lang.key,
                      (lang, index) => html`
                        <li
                          class=${classMap({
                            option: true,
                            active: this.selectedLanguages.includes(lang)
                          })}
                          @click=${() => this.handleSelection(lang)}
                        >
                          <button>${lang.name}</button>
                        </li>
                      `
                    )}
                  </ul>
                </div>
              `
            : null
        )}
      </div>
    `
  }
}

customElements.define('language-picker', LanguagePicker)
