import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("kodi-search-controls")
export class SearchControls extends LitElement {
    @property() query = "";
    @property() searchAction: "play" | "add" = "play";
    @property() showActionMode = true;
    @property() showRecentlyAdded = true;
    @property() showRecentlyPlayed = true;
    @property() showCurrentArtist = true;

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .kodi-controls {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .search-box {
                display: flex;
                align-items: center;
                background: var(--secondary-background-color);
                border-radius: 8px;
                padding: 0 12px;
                height: 40px;
            }

            .search-box input {
                flex: 1;
                border: none;
                background: none;
                outline: none;
                color: var(--primary-text-color);
            }

            .control-toolbar {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: space-between;
                padding: 8px 0;
            }

            .control-actions {
                display: flex;
                background: var(--secondary-background-color);
                border-radius: 8px;
                padding: 4px;
                gap: 4px;
            }

            .action-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                color: var(--secondary-text-color);
                transition: all 0.2s ease;
            }

            .action-btn ha-icon {
                --mdc-icon-size: 20px;
            }

            .action-btn.active {
                background: var(--primary-color);
                color: var(--text-primary-color, #ffffff);
            }

            .action-btn:hover:not(.active) {
                background: rgba(255, 255, 255, 0.05);
                color: var(--primary-text-color);
            }

            .navigation-icons {
                display: flex;
                gap: 8px;
            }

            .icon-btn {
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
            }

            .icon-btn:hover {
                background: rgba(255, 255, 255, 0.05);
            }
        `;
    }

    protected render() {
        return html`
            <div class="kodi-controls">
                <div class="search-box">
                    <ha-icon
                        icon="mdi:magnify"
                        style="margin-right: 8px; color: var(--secondary-text-color);"></ha-icon>
                    <input
                        type="text"
                        .value="${this.query}"
                        placeholder="Search on Kodi..."
                        @input="${this._handleInputChange}"
                        @keydown="${this._handleKeyDown}" />
                    <ha-icon
                        icon="mdi:close"
                        style="cursor: pointer; color: var(--secondary-text-color);"
                        @click="${this._handleClear}">
                    </ha-icon>
                </div>

                <div class="control-toolbar">
                    <div class="control-actions">
                        ${this.showActionMode
                            ? html`
                                  <div
                                      class="action-btn ${this.searchAction === "play" ? "active" : ""}"
                                      @click="${() => this._handleActionChange("play")}">
                                      <ha-icon icon="mdi:play"></ha-icon>
                                      <span>Play</span>
                                  </div>
                                  <div
                                      class="action-btn ${this.searchAction === "add" ? "active" : ""}"
                                      @click="${() => this._handleActionChange("add")}">
                                      <ha-icon icon="mdi:plus"></ha-icon>
                                      <span>Add</span>
                                  </div>
                              `
                            : html``}
                    </div>

                    <div class="navigation-icons">
                        ${this.showRecentlyPlayed
                            ? html`
                                  <ha-icon
                                      icon="mdi:history"
                                      class="icon-btn"
                                      @click="${() =>
                                          this.dispatchEvent(
                                              new CustomEvent("navigate", { detail: "recently_played" }),
                                          )}"
                                      title="Recently played"></ha-icon>
                              `
                            : html``}
                        ${this.showRecentlyAdded
                            ? html`
                                  <ha-icon
                                      icon="mdi:clock-plus"
                                      class="icon-btn"
                                      @click="${() =>
                                          this.dispatchEvent(
                                              new CustomEvent("navigate", { detail: "recently_added" }),
                                          )}"
                                      title="Recently added"></ha-icon>
                              `
                            : html``}
                        ${this.showCurrentArtist
                            ? html`
                                  <ha-icon
                                      icon="mdi:account-music"
                                      class="icon-btn"
                                      @click="${() =>
                                          this.dispatchEvent(
                                              new CustomEvent("navigate", { detail: "current_artist" }),
                                          )}"
                                      title="Current artist"></ha-icon>
                              `
                            : html``}
                    </div>
                </div>
            </div>
        `;
    }

    // New helper method to add to the SearchControls class:
    private _handleClear(): void {
        this.query = ""; // Clear the text field locally.
        this.dispatchEvent(new CustomEvent("clear", { bubbles: true, composed: true }));
    }

    private _handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this.dispatchEvent(new CustomEvent("search"));
        }
    }

    private _handleInputChange(e: Event): void {
        const target = e.target as HTMLInputElement;
        this.query = target.value;

        this.dispatchEvent(
            new CustomEvent("query-changed", {
                detail: this.query,
                bubbles: true,
                composed: true,
            }),
        );
    }

    private _handleActionChange(action: "play" | "add"): void {
        this.searchAction = action;
        this.dispatchEvent(
            new CustomEvent("action-changed", {
                detail: action,
                bubbles: true,
                composed: true,
            }),
        );
    }
}

