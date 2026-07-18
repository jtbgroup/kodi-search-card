import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { searchControlsCSS } from "../styles/search-controls.style";
import { SearchActionType } from "../types";
import { ACTION_MAP } from "../const";

@customElement("kodi-search-controls")
export class SearchControls extends LitElement {
    @property() query = "";
    @property({ type: String }) searchAction: SearchActionType = ACTION_MAP.play.id;
    @property() showActionMode = true;
    @property() showRecentlyAdded = true;
    @property() showRecentlyPlayed = true;
    @property() showCurrentArtist = true;
    @property() showMusicPlaylists = true;

    static get styles(): CSSResultGroup {
        return [searchControlsCSS];
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
                                      class="action-btn ${this.searchAction === ACTION_MAP.play.id ? "active" : ""}"
                                      @click="${() => this._handleActionChange(ACTION_MAP.play.id)}">
                                      <ha-icon icon="mdi:play"></ha-icon>
                                      <span>Play</span>
                                  </div>
                                  <div
                                      class="action-btn ${this.searchAction === ACTION_MAP.add.id ? "active" : ""}"
                                      @click="${() => this._handleActionChange(ACTION_MAP.add.id)}">
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
                        ${this.showMusicPlaylists
                            ? html`
                                  <ha-icon
                                      icon="mdi:playlist-music"
                                      class="icon-btn"
                                      @click="${() =>
                                          this.dispatchEvent(
                                              new CustomEvent("navigate", { detail: "music_playlists" }),
                                          )}"
                                      title="Music playlists"></ha-icon>
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

    private _handleActionChange(action: SearchActionType): void {
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

