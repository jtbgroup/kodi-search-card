import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";

@customElement("kodi-results-grid")
export class ResultsGrid extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() category = "";
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;

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

_renderGridItem(item: SearchResultItem) {
    const icon = CategoryHelper.getCategoryIcon(this.category);
    const isContainer = CategoryHelper.isContainerCategory(this.category);
    
    // FORCER L'ICÔNE D'INFORMATION POUR LES DRILLDOWNS
    let actionIcon = CategoryHelper.getActionIcon(this.category, this.searchAction);
    if (this.category === "artist" || this.category === "tvshow") {
        actionIcon = "mdi:information"; // Met l'icône d'info au survol
    }

    let thumbnailUrl: string | undefined;
    if (this.thumbnailService) {
        thumbnailUrl = this.thumbnailService.getItemThumbnailUrl(item, this.category);
        if (thumbnailUrl && !this.thumbnailService.isCached(thumbnailUrl)) {
            this.thumbnailService.loadThumbnail(thumbnailUrl);
        }
    }

    const isCached = this.thumbnailService ? this.thumbnailService.isCached(thumbnailUrl || "") : false;
    const cachedUrl = this.thumbnailService?.getCachedThumbnail(thumbnailUrl || "");

    return html`
        <div class="grid-card" @click="${() => this.dispatchEvent(new CustomEvent("item-click", { detail: item }))}">
            <kodi-item-thumbnail
                .imageUrl="${cachedUrl}"
                .icon="${icon}"
                .isCached="${isCached}"
                .isContainer="${isContainer}"
                .actionIcon="${actionIcon}" size="large"
                .hasOverlay="${true}"></kodi-item-thumbnail>
            <div class="grid-title">${item.title || item.label}</div>
            <div class="grid-meta">${CategoryHelper.getMetaLine(item, this.category)}</div>
        </div>
    `;
}
}

