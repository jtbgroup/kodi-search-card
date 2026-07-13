import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem, ItemClickDetail } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import {
    buildMetadataString,
    getActionIcon,
    getCategoryIcon,
    getThumbnailAspectRatio,
    isContainerCategory,
} from "../utils/formatters";
import { resultGridCSS } from "../styles/results-grid.style";

@customElement("kodi-results-grid")
export class ResultsGrid extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() category = "";
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;
    @property({ type: Boolean }) showThumbnail? = true;
    @property({ type: Boolean }) showThumbnailOverlay? = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor = "var(--divider-color)";

    static get styles(): CSSResultGroup {
        return [resultGridCSS];
    }

    protected render() {
        return html` <div class="results-grid">${this.items.map(item => this._renderGridItem(item))}</div> `;
    }

    private _renderGridItem(item: SearchResultItem) {
        const icon = getCategoryIcon(this.category);
        const isContainer = isContainerCategory(this.category);

        const ratio = getThumbnailAspectRatio(this.category);
        const customStyle = `--thumb-ratio: ${ratio}`;

        let actionIcon = getActionIcon(this.category, this.searchAction);
        if (this.category === "artists" || this.category === "tvshow") {
            actionIcon = "mdi:information";
        }

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
                    .showThumbnail="${this.showThumbnail}"
                    .showThumbnailOverlay="${this.showThumbnailOverlay}"
                    .outlineColor="${this.outlineColor}"
                    .showThumbnailBorder="${this.showThumbnailBorder}"
                    size="large"
                    style="${customStyle}">
                </kodi-item-thumbnail>
                <div class="grid-title">${item.title || item.label} ${item.year ? "(" + item.year + ")" : ""}</div>
                <div class="grid-meta" title="${meta}">${meta}</div>
            </div>
        `;
    }
}

