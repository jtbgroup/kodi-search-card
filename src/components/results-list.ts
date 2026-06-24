import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";

@customElement("kodi-results-list")
export class ResultsList extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() category = "";
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;

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
                color: #ffffff;
                font-weight: 500;
                font-size: 0.95rem;
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

  // Dans results-list.ts -> Méthode de rendu de la ligne
_renderListItem(item: SearchResultItem) {
    const title = item.title || item.name || item.label || "";
    const meta = CategoryHelper.getMetaLine(item, this.category);
    const icon = CategoryHelper.getCategoryIcon(this.category);
    
    // FORCER L'ICÔNE D'INFORMATION POUR LES DRILLDOWNS
    let actionIcon = CategoryHelper.getActionIcon(this.category, this.searchAction);
    if (this.category === "artist" || this.category === "tvshow") {
        actionIcon = "mdi:information";
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
        <div class="list-item" @click="${() => this.dispatchEvent(new CustomEvent("item-click", { detail: item }))}">
            <kodi-item-thumbnail
                .imageUrl="${cachedUrl}"
                .icon="${icon}"
                .isCached="${isCached}"
                .actionIcon="${actionIcon}"
                size="small"
                .hasOverlay="${true}"></kodi-item-thumbnail>

            <div class="item-info">
                <div class="item-title">${title}</div>
                <div class="item-subtext">${meta}</div>
            </div>

            ${item.duration ? html` <div class="item-duration">${CategoryHelper.formatDuration(item.duration)}</div> ` : ""}
        </div>
    `;
}
}

