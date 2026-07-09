import { LitElement, html, css, PropertyValues, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ThumbnailService } from "../services/thumbnail-service";
import { SearchResultItem } from "../types";
import { styleMap } from "lit/directives/style-map.js";
import { itemThumbnailCSS } from "../styles/item-thumbnail.style";

@customElement("kodi-item-thumbnail")
export class ItemThumbnail extends LitElement {
    @property({ type: Object }) item?: SearchResultItem;
    @property({ type: String }) category = "";
    @property({ type: Object }) thumbnailService?: ThumbnailService;

    @property() icon = "mdi:image";
    @property() size: "small" | "large" = "large";
    @property({ type: Boolean }) isContainer = false;
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor = "var(--divider-color)";

    @state() private _imageUrl?: string;
    @state() private _isLoaded = false;

    static get styles(): CSSResultGroup {
        return [itemThumbnailCSS];
    }

    protected willUpdate(changedProperties: PropertyValues) {
        super.willUpdate(changedProperties);

        if ((changedProperties.has("item") || changedProperties.has("thumbnailService")) && this.showThumbnail) {
            this._loadImage();
        }
    }

    private async _loadImage() {
        this._imageUrl = undefined;
        this._isLoaded = false;

        if (!this.item || !this.thumbnailService) return;

        // 1. Retrieve the theoretical URL.
        const url = this.thumbnailService.getItemThumbnailUrl(this.item, { category: this.category });
        if (!url) return;

        // 2. Check the cache (synchronously).
        const cachedUrl = this.thumbnailService.getCachedThumbnail(url);
        if (cachedUrl) {
            this._imageUrl = cachedUrl;
            this._isLoaded = true;
            return;
        }

        // 3. Load the image (asynchronously).
        const loadedUrl = await this.thumbnailService.loadThumbnail(url);
        if (loadedUrl) {
            this._imageUrl = loadedUrl;
            this._isLoaded = true;
        }
    }

    protected render() {
        const containerClass = this.isContainer ? "is-container" : "";
        const thumbnailContent =
            this._isLoaded && this._imageUrl
                ? html`<img class="thumb-image" src="${this._imageUrl}" />`
                : html`<div class="thumb-placeholder ${containerClass}"><ha-icon .icon="${this.icon}"></ha-icon></div>`;
        const overlayTemplate = this.showThumbnailOverlay
            ? html`<div class="thumb-overlay"><ha-icon .icon="${this.actionIcon}"></ha-icon></div>`
            : "";

        const cssVariables = this.showThumbnailBorder ? `--outline-color: ${this.outlineColor};` : "";

        return html`
            <div class="thumb-wrapper ${this.showThumbnailBorder ? "with-border" : ""} " style="${cssVariables}">
                ${thumbnailContent} ${overlayTemplate}
            </div>
        `;
    }
}

