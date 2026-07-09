import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { buildMetadataString, formatDuration, formatGenre, getActionIcon, getCategoryIcon } from "../utils/formatters";
import { resultListCSS } from "../styles/results-list.style";

@customElement("kodi-results-list")
export class ResultsList extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() category = "";
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;
    @property({ type: Boolean }) showThumbnail? = true;
    @property({ type: Boolean }) showThumbnailOverlay? = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor="var(--divider-color)";

    static get styles(): CSSResultGroup {
        return [resultListCSS];
    }

    protected render() {
        return html`
            <ul class="results-list">
                ${this.items.map(item => this._renderListItem(item))}
            </ul>
        `;
    }

    private _renderListItem(item: SearchResultItem) {
        const title = item.title || item.name || item.label || "";
        const genre = item.genre ? formatGenre(item.genre) : "";
        const subtext = buildMetadataString(item, this.category);
        const icon = getCategoryIcon(this.category);

        let actionIcon = getActionIcon(this.category, this.searchAction);
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
                    .item="${item}"
                    .category="${this.category}"
                    .thumbnailService="${this.thumbnailService}"
                    .icon="${icon}"
                    .actionIcon="${actionIcon}"
                    .showThumbnail="${this.showThumbnail}"
                    .showThumbnailOverlay="${this.showThumbnailOverlay}"
                    .outlineColor="${this.outlineColor}"
                    .showThumbnailBorder="${this.showThumbnailBorder}"
                    size="small">
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

