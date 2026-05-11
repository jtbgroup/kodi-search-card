import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { until } from "lit/directives/until.js";
import { coverStyles } from "../styles/cover.styles";

@customElement("kodi-cover-element")
export class KodiCoverElement extends LitElement {
    @property() coverClass = "";
    @property() defaultIconClass = "";
    @property() defaultIcon = "mdi:music";
    @property() overlayIcon = "mdi:play";
    @property() imageUrl = "";
    @property({ attribute: false }) imagePromise: Promise<string> | null = null;
    @property({ type: Boolean }) showOverlay = true;
    @property({ type: Boolean }) showBorder = false;

    private _emitAction(): void {
        this.dispatchEvent(new CustomEvent("kodi-cover-action", { bubbles: true, composed: true }));
    }

    protected render(): TemplateResult {
        const wrapperClass = [this.coverClass, "search-item-cover", this.showBorder ? "cover-image-outline-border" : ""]
            .filter(Boolean)
            .join(" ");

        return html`
            <div class=${wrapperClass}>
                <div class="search-item-cover-container">
                    <ha-icon
                        icon=${this.defaultIcon}
                        class="${this.defaultIconClass} search-item-cover-image-default"></ha-icon>

                    ${this._renderImage()}
                    ${this.showOverlay
                        ? html`
                              <ha-icon
                                  class="overlay-play"
                                  icon=${this.overlayIcon}
                                  @click=${this._emitAction}></ha-icon>
                          `
                        : ""}
                </div>
            </div>
        `;
    }

    private _renderImage(): TemplateResult {
        const clickHandler = this.showOverlay ? undefined : this._emitAction.bind(this);

        if (this.imagePromise) {
            const bgPromise = this.imagePromise.then(v => `url(${v})`);
            return html`
                <div
                    class="search-item-cover-image"
                    @click=${clickHandler}
                    style="background-size: contain; background-image: ${until(bgPromise, "")}"></div>
            `;
        }

        if (this.imageUrl) {
            return html` <img class="search-item-cover-image" src=${this.imageUrl} @click=${clickHandler} alt="" /> `;
        }

        return html`<div class="search-item-cover-image" @click=${clickHandler}></div>`;
    }

    static get styles(): CSSResultGroup {
        return [
            coverStyles,
            css`
                /*
                 * display: block (not contents) so the host box exists and
                 * inherits width/height set by the parent media component.
                 * width/height: 100% fill whatever the parent assigns via
                 * grid-column sizing (e.g. width: var(--album-thumbnail-width)).
                 */
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                /* The inner wrapper must also fill the host */
                .search-item-cover,
                .search-item-cover-container {
                    width: 100%;
                    height: 100%;
                }

                img.search-item-cover-image {
                    object-fit: contain;
                }
            `,
        ];
    }
}
