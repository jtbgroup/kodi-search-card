import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ThumbnailService } from "../services/thumbnail-service";
import { SearchResultItem } from "../types";

@customElement("kodi-item-thumbnail")
export class ItemThumbnail extends LitElement {
    // ⬇️ NOUVELLES PROPRIÉTÉS ⬇️
    @property({ type: Object }) item?: SearchResultItem;
    @property({ type: String }) category = "";
    @property({ type: Object }) thumbnailService?: ThumbnailService;

    // ⬇️ PROPRIÉTÉS CONSERVÉES ⬇️
    @property() icon = "mdi:image";
    @property() size: "small" | "large" = "large";
    @property({ type: Boolean }) isContainer = false;
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) hasOverlay = false;

    // ⬇️ ÉTATS INTERNES (Remplacent imageUrl et isCached) ⬇️
    @state() private _imageUrl?: string;
    @state() private _isLoaded = false;

    static get styles() {
        return css`
            :host {
                display: contents;
            }

            .thumb-wrapper {
                position: relative;
                cursor: pointer;
                overflow: hidden;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--secondary-background-color);
                aspect-ratio: var(--thumb-ratio, 1/1);
            }

            :host([size="large"]) .thumb-wrapper {
                width: 100%;
            }

            :host([size="small"]) .thumb-wrapper {
                width: 60px;
                height: 60px;
                flex-shrink: 0;
            }

            .thumb-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .thumb-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--secondary-background-color);
            }

            .thumb-placeholder.is-container {
                background-color: var(--secondary-background-color);
                opacity: 0.8;
                position: relative;
            }

            .thumb-placeholder.is-container ha-icon {
                position: absolute;
                bottom: 8px;
                right: 8px;
            }

            .thumb-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                color: #ffffff !important; /* Force l'icône en blanc */
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none; /* Laisse passer le clic vers la carte */
                z-index: 2; /* Passe au-dessus de l'image ou du placeholder */
            }

            .thumb-wrapper:hover .thumb-overlay {
                opacity: 1;
            }

            :host([size="large"]) .thumb-overlay ha-icon {
                --mdc-icon-size: 40px;
            }

            :host([size="small"]) .thumb-overlay ha-icon {
                --mdc-icon-size: 24px;
            }
        `;
    }

    // Intercepte les changements de propriétés pour lancer le chargement
    protected willUpdate(changedProperties: PropertyValues) {
        super.willUpdate(changedProperties);

        // Si l'item ou le service change, on relance le processus d'image
        if (changedProperties.has("item") || changedProperties.has("thumbnailService")) {
            this._loadImage();
        }
    }

    private async _loadImage() {
        // Reset d'abord l'état
        this._imageUrl = undefined;
        this._isLoaded = false;

        if (!this.item || !this.thumbnailService) return;

        // 1. Récupérer l'URL théorique
        const url = this.thumbnailService.getItemThumbnailUrl(this.item, { category: this.category });
        if (!url) return;

        // 2. Vérifier le cache (Synchrone)
        const cachedUrl = this.thumbnailService.getCachedThumbnail(url);
        if (cachedUrl) {
            this._imageUrl = cachedUrl;
            this._isLoaded = true;
            return;
        }

        // 3. Charger l'image (Asynchrone)
        const loadedUrl = await this.thumbnailService.loadThumbnail(url);
        if (loadedUrl) {
            this._imageUrl = loadedUrl;
            this._isLoaded = true; // ⚠️ Ceci déclenche un rendu UNIQUEMENT pour ce composant !
        }
    }

    protected render() {
        const containerClass = this.isContainer ? "is-container" : "";
        const overlayTemplate = this.hasOverlay
            ? html`<div class="thumb-overlay"><ha-icon .icon="${this.actionIcon}"></ha-icon></div>`
            : "";

        // On utilise maintenant nos états locaux _isLoaded et _imageUrl
        if (this._isLoaded && this._imageUrl) {
            return html`
                <div class="thumb-wrapper">
                    <img class="thumb-image" src="${this._imageUrl}" />
                    ${overlayTemplate}
                </div>
            `;
        }

        return html`
            <div class="thumb-wrapper">
                <div class="thumb-placeholder ${containerClass}">
                    <ha-icon .icon="${this.icon}"></ha-icon>
                </div>
                ${overlayTemplate}
            </div>
        `;
    }
}
