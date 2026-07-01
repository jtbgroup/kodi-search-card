import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import { buildMetadataString, formatDuration, formatGenre } from "../utils/formatters";

@customElement("kodi-results-list")
export class ResultsList extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() category = "";
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;
    // @property() imageUpdateCounter = 0;

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .results-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .list-item {
                display: flex;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #252525;
                cursor: pointer;
                gap: 12px;
            }

            .list-item:last-child {
                border-bottom: none;
            }

            .list-item:hover {
                opacity: 0.8;
                background: var(--secondary-background-color);
            }

            .item-info {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow: hidden;
            }

            .item-title {
                color: var(--secondary-text-color);
                font-weight: 500;
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-genre {
                font-style: italic;
                margin-top: 2px;
                font-size: 0.8rem;
                color: var(--secondary-text-color);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-subtext {
                color: #8a8a8a;
                font-size: 0.8rem;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-duration {
                color: #8a8a8a;
                font-size: 0.8rem;
                font-family: monospace;
                margin-left: 12px;
                flex-shrink: 0;
            }
        `;
    }

    protected render() {
        return html`
            <ul class="results-list">
                ${this.items.map(item => this._renderListItem(item))}
            </ul>
        `;
    }

    // private _getThumbnailForItem(
    //     item: SearchResultItem,
    //     category: string,
    // ): { cachedUrl: string | undefined; isCached: boolean } {
    //     if (!this.thumbnailService) {
    //         return { cachedUrl: undefined, isCached: false };
    //     }

    //     // Étape 1: Résoudre l'URL
    //     const url = this.thumbnailService.getItemThumbnailUrl(item, { category });
    //     if (!url) {
    //         return { cachedUrl: undefined, isCached: false };
    //     }

    //     // Étape 2: Vérifier le cache
    //     const cachedUrl = this.thumbnailService.getCachedThumbnail(url);
    //     const isCached = !!cachedUrl;

    //     // Étape 3: Si pas en cache, charger en arrière-plan
    //     if (!isCached) {
    //         // 🔑 AMÉLIORATION: load() est intelligent
    //         // Si un autre appel charge la même image, il attend le premier
    //         // au lieu de lancer une requête HTTP dupliquée
    //         this.thumbnailService.loadThumbnail(url).then(() => {
    //             console.debug(`[Album Detail] Image chargée: ${url}`);
    //         });
    //     }

    //     return { cachedUrl, isCached };
    // }

    private _renderListItem(item: SearchResultItem) {
        const title = item.title || item.name || item.label || "";
        const genre = item.genre ? formatGenre(item.genre) : "";
        const subtext = buildMetadataString(item, this.category);
        const icon = CategoryHelper.getCategoryIcon(this.category);

        let actionIcon = CategoryHelper.getActionIcon(this.category, this.searchAction);
        if (this.category === "artists" || this.category === "tvshow") {
            actionIcon = "mdi:information";
        }

        // const { cachedUrl, isCached } = this._getThumbnailForItem(item, this.category);

        const handleClick = () => {
            const detail: ItemClickDetail = { item, category: this.category };
            this.dispatchEvent(
                new CustomEvent("item-click", {
                    detail,
                    bubbles: false,
                    composed: true,
                }),
            );
        };

        return html`
            <div class="list-item" @click="${handleClick}">
                <kodi-item-thumbnail
                    .icon="${icon}"
                    .actionIcon="${actionIcon}"
                    size="small"
                    .hasOverlay="${true}">
                </kodi-item-thumbnail>

                <div class="item-info">
                    <div class="item-title">${title}</div>
                    <div class="item-genre">${genre}</div>
                    <div class="item-subtext">${subtext}</div>
                </div>

                ${item.duration ? html` <div class="item-duration">${formatDuration(item.duration)}</div> ` : ""}
            </div>
        `;
    }
}

