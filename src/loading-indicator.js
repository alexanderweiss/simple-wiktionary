import { LitElement, html, css, svg } from 'lit-element'

const SPINNER_ARMS_COUNT = 12
const SPINNER_ANIMATION_DURATION = 1.2

export default class LoadingIndicator extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          --color: #777;
          color: var(--color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
        }

        .spinner {
          position: relative;
          width: 1.8rem;
          height: 1.8rem;

          margin-right: 0.75rem;
        }

        .spinner > div {
          position: absolute;
          left: 0.9rem;
          bottom: 0.9rem;

          width: 0.15rem;
          height: 0.5rem;
          background: var(--color);
          transform-origin: 50% 100%;

          border-radius: 1rem;

          animation: arm-animation ${SPINNER_ANIMATION_DURATION}s infinite
            ease-in-out both;
        }

        @keyframes arm-animation {
          0%,
          20%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
      `,
      ...[...new Array(SPINNER_ARMS_COUNT)].map(
        (_, i) => css`
          .spinner > div:nth-child(${i + 1}) {
            transform: rotate(-${(360 / SPINNER_ARMS_COUNT) * i}deg)
              translateY(-0.4rem);
            animation-delay: -${(SPINNER_ANIMATION_DURATION / SPINNER_ARMS_COUNT) * i}s;
          }
        `
      )
    ]
  }

  render() {
    return html`
      <div class="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      Loading...
    `
  }
}
customElements.define('loading-indicator', LoadingIndicator)
