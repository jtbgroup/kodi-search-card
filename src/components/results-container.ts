import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResults, SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import "./results-grid";
import "./results-list";
import "./album-detail-view";
import "./season-detail-view"; // Assure-toi que le fichier est bien dans le même dossier

@customElement("kodi-results-container")
export class ResultsContainer extends LitElement {
    @property({ type: Object }) results: SearchResults | null = null;
    @property({ type: String }) searchAction: "play" | "add" = "play";
    @property({ type: Object }) thumbnailService?: ThumbnailService;

    // Propriétés pour les vues de Drilldown
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

        // --- NORMALISATION DES DONNÉES ---
        // Permet d'accepter { albums: [...] } (Artistes) OU { results: { seasons: [...] } } (Séries)
        const rawResults = this.results as any;
        const dataToRender: SearchResults =
            rawResults && rawResults.results && !Array.isArray(rawResults.results) ? rawResults.results : this.results;

        // --- VÉRIFICATION ---
        const hasResults =
            Object.keys(dataToRender).length > 0 &&
            Object.values(dataToRender).some(items => Array.isArray(items) && items.length > 0);

        if (!hasResults) {
            return html`<div class="no-results-msg">Aucun résultat</div>`;
        }

        return html`
            <div class="results-wrapper" @item-click="${this._onItemClick}">
                ${Object.entries(dataToRender).map(([category, items]) => {
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
        

        // 1. Vue détaillée : ARTISTE -> Albums/Chansons
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

        // 2. Vue détaillée : SÉRIE TV -> Saisons/Épisodes
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

        // 3. Vue standard pour les autres catégories (Recherche globale)
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
        // Laisse remonter l'événement vers la carte principale (kodi-search-card.ts)
        this.dispatchEvent(
            new CustomEvent("item-click", {
                detail: e.detail,
                bubbles: true,
                composed: true,
            }),
        );
    };
}

