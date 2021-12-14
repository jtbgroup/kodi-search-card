const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

const LitElement = customElements.get("hui-masonry-view")
  ? Object.getPrototypeOf(customElements.get("hui-masonry-view"))
  : Object.getPrototypeOf(customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const HELPERS = window.loadCardHelpers();

export class KodiSearchCardEditor extends LitElement {
  setConfig(config) {
    this._config = { ...config };
  }

  static get properties() {
    return { hass: {}, _config: {} };
  }

  get _entity() {
    return this._config.entity;
  }

  get _show_thumbnail() {
    return this._config.show_thumbnail;
  }

  get _show_thumbnail_border() {
    return this._config.show_thumbnail_border;
  }

  get _show_thumbnail_overlay() {
    return this._config.show_thumbnail_overlay;
  }

  get _outline_color() {
    return this._config.outline_color;
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          label="Playlist sensor entity"
          .hass="${this.hass}"
          .value="${this._config.entity}"
          .configValue=${"entity"}
          domain-filter="sensor"
          @change="${this._valueChanged}"
          allow-custom-entity
          class="config"
        ></ha-entity-picker>

        <div class="config">
          <span class="config-label">Show thumbnail</span>
          <ha-switch
            .checked=${this._config.show_thumbnail}
            .configValue="${"show_thumbnail"}"
            @change="${this._valueChanged}"
            class="config-component"
          ></ha-switch>
        </div>

        <div class="config">
          <span class="config-label">Show thumbnail overlay</span>
          <ha-switch
            .checked=${this._config.show_thumbnail_overlay}
            .configValue="${"show_thumbnail_overlay"}"
            @change="${this._valueChanged}"
            class="config-component"
          ></ha-switch>
        </div>

        <div class="config">
          <span class="config-label">Show thumbnail border</span>
          <ha-switch
            .checked=${this._config.show_thumbnail_border}
            .configValue="${"show_thumbnail_border"}"
            @change="${this._valueChanged}"
            class="config-component"
          ></ha-switch>
        </div>

        <paper-input
          label="Outline color"
          .configValue="${"outline_color"}"
          .value=${this._config.outline_color}
          @value-changed=${this._valueChanged}
          class="config"
        ></paper-input>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles() {
    return css`
      .card-config {
        display: grid;
        grid-rows: auto;
        grid-columns: auto;
        grid-gap: 5px;
      }
      .config {
        display: grid;
        grid-columns: auto 1fr;
        grid-rows: auto;
      }
      .config-label {
        grid-column: 1;
      }

      .config-component {
        grid-column: 2;
        margin-left: auto;
        margin-right: 0;
      }
    `;
  }
}

customElements.define("kodi-search-card-editor", KodiSearchCardEditor);
