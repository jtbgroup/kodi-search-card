import { CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ACTION_MAP } from "../const";
import { sharedStyles } from "../styles/shared.styles";
import { formStyles } from "../styles/form.styles";

@customElement("kodi-search-form")
export class KodiSearchForm extends LitElement {
    @property() actionMode = "play";
    @property({ type: Boolean }) showActionMode = true;
    @property({ type: Boolean }) showRecentlyAdded = true;
    @property({ type: Boolean }) showRecentlyPlayed = true;
    @property({ type: Boolean }) showCurrentArtist = false;

    @query("input.search-input") private _searchInput!: HTMLInputElement;

    @state() private _currentMode = "play";

    protected willUpdate(changedProps: PropertyValues): void {
        if (changedProps.has("actionMode")) {
            this._currentMode = this.actionMode;
        }
    }

    public clearSearchField(): void {
        if (this._searchInput) this._searchInput.value = "";
    }

    private _emit(name: string, detail?: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: detail ?? {} }));
    }

    private _onSearch(): void {
        const value = this._searchInput?.value ?? "";
        this._emit("kodi-search", { value });
        this.clearSearchField();
    }

    private _onClear(): void {
        this.clearSearchField();
        this._emit("kodi-clear");
    }

    private _onKeyDown(ev: KeyboardEvent): void {
        if (ev.code === "Enter") this._onSearch();
    }

    private _onActionModeChanged(ev: Event): void {
        const mode = (ev.target as HTMLSelectElement).value;
        if (!mode || mode === this._currentMode) return;
        this._currentMode = mode;
        this._emit("kodi-action-mode-changed", { mode });
    }

    protected render(): TemplateResult {
        return html`
            <div id="search-form-controls-grid">
                <div class="search-form-controls-fields-grid">
                    <div class="search-field-container">
                        <label class="field-label">Search criteria</label>
                        <input type="text" class="search-input" placeholder="Search..." @keydown=${this._onKeyDown} />
                    </div>

                    ${this.showActionMode
                        ? html`
                              <div class="search-field-container">
                                  <label class="field-label">Action mode</label>
                                  <select class="search-input" @change=${this._onActionModeChanged}>
                                      ${Object.keys(ACTION_MAP).map(
                                          action => html`
                                              <option value=${action} ?selected=${this._currentMode === action}>
                                                  ${ACTION_MAP[action].label}
                                              </option>
                                          `,
                                      )}
                                  </select>
                              </div>
                          `
                        : ""}
                </div>

                <div class="search-form-controls-buttons-mandatory-grid">
                    <ha-button raised variant="brand" @click=${this._onSearch}>Search</ha-button>
                    <ha-button raised variant="brand" @click=${this._onClear}>Clear</ha-button>
                </div>

                <div class="search-form-controls-buttons-optional-grid">
                    ${this.showRecentlyAdded
                        ? html`<ha-button variant="outlined" raised @click=${() => this._emit("kodi-recently-added")}
                              >Recently added</ha-button
                          >`
                        : ""}
                    ${this.showRecentlyPlayed
                        ? html`<ha-button variant="outlined" raised @click=${() => this._emit("kodi-recently-played")}
                              >Recently played</ha-button
                          >`
                        : ""}
                    ${this.showCurrentArtist
                        ? html`<ha-button variant="outlined" raised @click=${() => this._emit("kodi-current-artist")}
                              >Current Artist</ha-button
                          >`
                        : ""}
                </div>
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, formStyles];
    }
}

