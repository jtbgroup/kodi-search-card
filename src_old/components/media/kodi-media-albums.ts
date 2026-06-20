import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { sharedStyles } from "../../styles/shared.styles";
import { albumsStyles } from "../../styles/media.styles";
import "../kodi-cover-element";

@customElement("kodi-media-albums")
export class KodiMediaAlbums extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property() kodiEntityId = "";
    /** When false, no thumbnail fetch is performed and the fallback icon shows. */
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;
    @property({ attribute: false }) hass!: HomeAssistant;

    private _emit(eventName: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }));
    }

    private _getImagePromise(albumId: string): Promise<string> {
        const url = `/api/media_player_proxy/${this.kodiEntityId}/browse_media/album/${albumId}`;
        return this.hass.fetchWithAuth(url).then(r => r.blob()).then(
            blob =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }),
        );
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-albums-grid search-grid search-item-container-grid">
                ${this.items.map(
                    item => html`
                        <div class="search-album-grid">
                            <kodi-cover-element
                                class="search-album-cover"
                                coverClass="search-album-cover"
                                defaultIconClass="search-album-cover-image-default"
                                defaultIcon="mdi:disc"
                                overlayIcon=${this.actionIcon}
                                .imagePromise=${this.showThumbnail ? this._getImagePromise(item.albumid) : null}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-album", { albumId: item.albumid })}></kodi-cover-element>
                            <div class="search-album-title search-title">${item.title}</div>
                            <div class="search-album-artist search-artist">${item.artist} (${item.year})</div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, albumsStyles];
    }
}
