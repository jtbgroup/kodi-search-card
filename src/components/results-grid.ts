import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import { buildMetadataString } from "../utils/formatters";

@customElement("kodi-results-grid")
export class ResultsGrid extends LitElement {
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

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 16px;
                padding-top: 4px;
            }

            .grid-card {
                display: flex;
                flex-direction: column;
                cursor: pointer;
            }

            .grid-card:hover {
                opacity: 0.8;
            }

            .grid-title {
                color: #ffffff;
                font-size: 0.85rem;
                font-weight: 500;
                line-height: 1.2;
                max-height: 2.4em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                margin-top: 8px;
            }

            .grid-meta {
                color: #8a8a8a;
                font-size: 0.75rem;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
    }

    protected render() {
        return html` <div class="results-grid">${this.items.map(item => this._renderGridItem(item))}</div> `;
    }

    //     private _getThumbnailForItem(
    //     item: SearchResultItem,
    //     category: string
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
    
    private _renderGridItem(item: SearchResultItem) {
        const icon = CategoryHelper.getCategoryIcon(this.category);
        const isContainer = CategoryHelper.isContainerCategory(this.category);

        const ratio = CategoryHelper.getThumbnailAspectRatio(this.category);
        const customStyle = `--thumb-ratio: ${ratio}`;
        
        let actionIcon = CategoryHelper.getActionIcon(this.category, this.searchAction);
        if (this.category === "artists" || this.category === "tvshow") {
            actionIcon = "mdi:information";
        }

        //  const { cachedUrl, isCached } = this._getThumbnailForItem(item, this.category);

        const handleClick = () => {
            const detail: ItemClickDetail = { item, category: this.category };
            this.dispatchEvent(
                new CustomEvent("item-click", { 
                    detail,
                    bubbles: false,
                    composed: true
                })
            );
        };

        const meta = buildMetadataString(item, this.category);

        return html`
            <div class="grid-card" @click="${handleClick}">
                <kodi-item-thumbnail
                  .item="${item}"
    .category="${this.category}"
    .thumbnailService="${this.thumbnailService}"
    .icon="${icon}"
    .isContainer="${isContainer}"
    .actionIcon="${actionIcon}"
    .hasOverlay="${true}"
    size="large"
    style="${customStyle}"
                    >
                </kodi-item-thumbnail>
                <div class="grid-title">${item.title || item.label} ${item.year ? "(" + item.year + ")" :""}</div>
                <div class="grid-meta" title="${meta}" >${meta}</div>
            </div>
        `;
    }
}