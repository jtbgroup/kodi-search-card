import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("kodi-item-thumbnail")
export class ItemThumbnail extends LitElement {
    @property() imageUrl?: string;
    @property() icon = "mdi:image";
    @property() isCached = false;
    @property() isLoading = false;
    @property() size: "small" | "large" = "large"; // small = list (60px), large = grid (100%+)
    @property() isContainer = false;
    @property() actionIcon = "mdi:play";
    
    // MODIFICATION ICI : On spécifie le type Boolean pour que LitElement intercepte correctement l'attribut HTML
    @property({ type: Boolean }) hasOverlay = false;

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
            }

            :host([size="large"]) .thumb-wrapper {
                width: 100%;
                aspect-ratio: 1/1;
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

            /* MODIFICATION ICI : On s'assure de la couleur blanche, du centrage et de la superposition */
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

    protected render() {
        const containerClass = this.isContainer ? "is-container" : "";
        const overlayTemplate = this.hasOverlay
            ? html`<div class="thumb-overlay"><ha-icon .icon="${this.actionIcon}"></ha-icon></div>`
            : "";

        if (this.isCached && this.imageUrl) {
            return html`
                <div class="thumb-wrapper">
                    <img class="thumb-image" src="${this.imageUrl}" />
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