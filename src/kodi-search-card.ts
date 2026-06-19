import "./kodi-search-card-editor";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

@customElement("kodi-search-card")
export class KodiSearchCard extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: any;

    static getConfigElement(): LovelaceCardEditor {
        return document.createElement("kodi-search-card-editor") as LovelaceCardEditor;
    }

    @state() private _results: any = null;
    @state() private _query = "";

    static styles = css`
        /* Reprendre ici le style CSS de kodi-search-card */
        .search-container {
            padding: 16px;
        }
        input {
            width: 100%;
            padding: 8px;
            margin-bottom: 16px;
        }
        .result-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #444;
        }
    `;

    async _performSearch() {
        const response: any = await this.hass.callWS({
            type: "kodi_media_sensors/search",
            entry_id: this._config.entity_id,
            query: this._query,
            category: "all",
        });

        this._results = response?.results || {};
    }

    render() {
        return html`
            <ha-card header="Recherche Kodi">
                <div class="search-container">
                    <input
                        .value="${this._query}"
                        @input="${(e: any) => (this._query = e.target.value)}"
                        placeholder="Rechercher..." />
                    <button @click="${this._performSearch}">Rechercher</button>
                </div>

                ${this._results
                    ? html`
                          <div class="results">
                              ${Object.keys(this._results).map(
                                  cat => html`
                                      <h3>${cat}</h3>
                                      ${this._results[cat].map(
                                          item => html`<div class="result-item">${item.title}</div>`,
                                      )}
                                  `,
                              )}
                          </div>
                      `
                    : ""}
            </ha-card>
        `;
    }
}
