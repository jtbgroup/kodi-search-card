import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResults, SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import "./results-grid";
import "./results-list";
import "./album-detail-view";

@customElement("kodi-results-container")
export class ResultsContainer extends LitElement {
    @property() results: SearchResults | null = null;
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;
    @property() isArtistView = false;
    @property() artistName = "";

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .results-wrapper {
                background-color: #141414;
                padding: 0 16px 16px 16px;
            }

            .category-section {
                margin-bottom: 24px;
            }

            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #333;
                padding-bottom: 6px;
                margin: 16px 0 12px 0;
                color: #ffffff;
                font-size: 0.95rem;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            .category-header ha-icon {
                --mdc-icon-size: 18px;
                opacity: 0.7;
                color: var(--accent-color, #03a9f4);
            }

            .no-results-msg {
                color: #8a8a8a;
                text-align: center;
                padding: 32px;
                font-size: 0.95rem;
                background-color: #141414;
            }
        `;
    }

    protected render() {
        if (!this.results) {
            return html``;
        }

        const hasResults =
            Object.keys(this.results).length > 0 &&
            Object.values(this.results).some(items => Array.isArray(items) && items.length > 0);

        if (!hasResults) {
            return html`<div class="no-results-msg">No results</div>`;
        }

        return html`
            <div class="results-wrapper">
                ${Object.entries(this.results).map(([category, items]) => {
                    if (Array.isArray(items) && items.length > 0) {
                        return this._renderSection(category, items);
                    }
                    return "";
                })}
            </div>
        `;
    }

    private _renderSection(category: string, items: SearchResultItem[]) {
        const categoryLower = category.toLowerCase();

        // Artist detail view with album list
        if (this.isArtistView && categoryLower === "albums") {
            return html`
                <div class="category-section">
                    <h3 class="category-header">
                        <span>ALBUMS DE : ${this.artistName.toUpperCase()}</span>
                        <ha-icon icon="mdi:album"></ha-icon>
                    </h3>
                    <kodi-album-detail-view
                        .items="${items}"
                        .thumbnailService="${this.thumbnailService}"
                        .searchAction="${this.searchAction}"
                        @item-click="${(e: any) => this.dispatchEvent(new CustomEvent("item-click", { detail: e.detail }))}"></kodi-album-detail-view>
                </div>
            `;
        }

        const isGridLayout = CategoryHelper.isGridLayout(category);
        const sectionIcon = CategoryHelper.getCategoryIcon(category);

        return html`
            <div class="category-section">
                <h3 class="category-header">
                    <span>${category.toUpperCase()}</span>
                    <ha-icon icon="${sectionIcon}"></ha-icon>
                </h3>
                ${isGridLayout
                    ? html`
                          <kodi-results-grid
                              .items="${items}"
                              .category="${category}"
                              .searchAction="${this.searchAction}"
                              .thumbnailService="${this.thumbnailService}"
                              @item-click="${(e: any) => this.dispatchEvent(new CustomEvent("item-click", { detail: e.detail }))}"></kodi-results-grid>
                      `
                    : html`
                          <kodi-results-list
                              .items="${items}"
                              .category="${category}"
                              .searchAction="${this.searchAction}"
                              .thumbnailService="${this.thumbnailService}"
                              @item-click="${(e: any) => this.dispatchEvent(new CustomEvent("item-click", { detail: e.detail }))}"></kodi-results-list>
                      `}
            </div>
        `;
    }
}
