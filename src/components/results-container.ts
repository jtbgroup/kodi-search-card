import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResults, SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import "./results-grid";
import "./results-list";
import "./album-detail-view";
import "./season-detail-view"; // Make sure the file is in the same folder.
import { getCategoryIcon, isGridLayout } from "../utils/formatters";
import { resultContainerCSS } from "../styles/results-container.style";
import { CATEGORY_CHANNELS } from "../const";

@customElement("kodi-results-container")
export class ResultsContainer extends LitElement {
    @property({ type: Object }) results: SearchResults | null = null;
    @property({ type: String }) searchAction: "play" | "add" = "play";
    @property({ type: Object }) thumbnailService?: ThumbnailService;

    @property({ type: Boolean }) isArtistView = false;
    @property({ type: String }) artistName = "";
    @property({ type: Boolean }) isTvShowView = false;
    @property({ type: String }) tvShowName = "";

    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = true;
    @property({ type: String }) outlineColor = "var(--divider-color)";
    @property({ type: String }) albumDetailsSort = "default";
    @property({ type: Array }) mediaTypeOrder: string[] = [];

    static get styles(): CSSResultGroup {
        return [resultContainerCSS];
    }

    protected render() {
        if (!this.results) {
            return html``;
        }

        const rawResults = this.results as any;
        const dataToRender: SearchResults =
            rawResults && rawResults.results && !Array.isArray(rawResults.results) ? rawResults.results : this.results;

        const hasResults =
            Object.keys(dataToRender).length > 0 &&
            Object.values(dataToRender).some(items => Array.isArray(items) && items.length > 0);

        if (!hasResults) {
            return html`<div class="no-results-msg">No results</div>`;
        }

        return html`
            <div class="results-wrapper" @item-click="${this._onItemClick}">
                ${Object.entries(dataToRender).map(([category, items]) => {
                    if (Array.isArray(items) && items.length > 0) {
                        // Cas spécifique pour les chaînes
                        if (category === CATEGORY_CHANNELS) {
                            // On sépare le tableau en deux grâce à la propriété channeltype
                            const tvItems = items.filter(item => item.channeltype === "tv");
                            const radioItems = items.filter(item => item.channeltype === "radio");

                            return html`
                                ${tvItems.length > 0 ? this._renderSection(category, tvItems):""}
                                ${radioItems.length > 0 ? this._renderSection(category, radioItems) : ""}
                            `;
                        }

                        // Comportement par défaut pour toutes les autres catégories
                        return this._renderSection(category, items);
                    }
                    return "";
                })}
            </div>
        `;
    }

    private _renderSection(category: string, items: SearchResultItem[]) {
        const categoryLower = category.toLowerCase();

        // 1. Detailed view: ARTIST -> Albums/Songs
        if (this.isArtistView && categoryLower === "albums") {
            return html`
                <div class="category-section">
                    <h3 class="category-header">
                        <span>ALBUMS : ${this.artistName.toUpperCase()}</span>
                        <ha-icon icon="mdi:album"></ha-icon>
                    </h3>
                    <kodi-album-detail-view
                        .items="${items}"
                        .thumbnailService="${this.thumbnailService}"
                        .showThumbnail="${this.showThumbnail}"
                        .showThumbnailOverlay="${this.showThumbnailOverlay}"
                        .outlineColor="${this.outlineColor}"
                        .showThumbnailBorder="${this.showThumbnailBorder}"
                        .searchAction="${this.searchAction}">
                    </kodi-album-detail-view>
                </div>
            `;
        }

        // 2. Detailed view: TV SHOW -> Seasons/Episodes
        if (this.isTvShowView && categoryLower === "seasons") {
            return html`
                <div class="category-section">
                    <h3 class="category-header">
                        <span>TV SHOW : ${this.tvShowName.toUpperCase()}</span>
                        <ha-icon icon="mdi:television-classic"></ha-icon>
                    </h3>
                    <kodi-season-detail-view
                        .items="${items}"
                        .thumbnailService="${this.thumbnailService}"
                        .showThumbnail="${this.showThumbnail}"
                        .showThumbnailOverlay="${this.showThumbnailOverlay}"
                        .outlineColor="${this.outlineColor}"
                        .showThumbnailBorder="${this.showThumbnailBorder}"
                        .searchAction="${this.searchAction}">
                    </kodi-season-detail-view>
                </div>
            `;
        }

        // 3. Standard view for the other categories (global search)
        const isGrid = isGridLayout(category);
        const sectionIcon = getCategoryIcon(category);

        let categoryTitle = category;
        if(category == CATEGORY_CHANNELS){
            categoryTitle += " " + items[0].channeltype;
        }

        return html`
            <div class="category-section">
                <h3 class="category-header">
                    <span>${categoryTitle.toUpperCase()}</span>
                    <ha-icon icon="${sectionIcon}"></ha-icon>
                </h3>
                ${isGrid
                    ? html`
                          <kodi-results-grid
                              .items="${items}"
                              .category="${category}"
                              .searchAction="${this.searchAction}"
                              .showThumbnail="${this.showThumbnail}"
                              .showThumbnailOverlay="${this.showThumbnailOverlay}"
                              .thumbnailService="${this.thumbnailService}"
                              .outlineColor="${this.outlineColor}"
                              .showThumbnailBorder="${this.showThumbnailBorder}">
                          </kodi-results-grid>
                      `
                    : html`
                          <kodi-results-list
                              .items="${items}"
                              .category="${category}"
                              .showThumbnail="${this.showThumbnail}"
                              .showThumbnailOverlay="${this.showThumbnailOverlay}"
                              .searchAction="${this.searchAction}"
                              .thumbnailService="${this.thumbnailService}"
                              .outlineColor="${this.outlineColor}"
                              .showThumbnailBorder="${this.showThumbnailBorder}">
                          </kodi-results-list>
                      `}
            </div>
        `;
    }

    private _onItemClick = (e: CustomEvent<ItemClickDetail>) => {
        // Let the event bubble up to the main card (kodi-search-card.ts).
        this.dispatchEvent(
            new CustomEvent("item-click", {
                detail: e.detail,
                bubbles: true,
                composed: true,
            }),
        );
    };
}

