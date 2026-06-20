import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { sharedStyles } from "../../styles/shared.styles";
import { songsStyles } from "../../styles/media.styles";
import "../kodi-cover-element";

@customElement("kodi-media-songs")
export class KodiMediaSongs extends LitElement {
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

    private _getImagePromise(albumId: string): Promise<string> | null {
        if (!this.showThumbnail || !albumId) return null;
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

    private _formatDuration(duration: number): string {
        return new Date(duration * 1000).toISOString().substring(11, 19);
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-songs-grid search-grid search-item-container-grid">
                ${this.items.map(
                    item => html`
                        <div class="search-song-grid">
                            <kodi-cover-element
                                class="search-song-cover"
                                coverClass="search-song-cover"
                                defaultIconClass="search-song-cover-image-default"
                                defaultIcon="mdi:music"
                                overlayIcon=${this.actionIcon}
                                .imagePromise=${item.thumbnail ? this._getImagePromise(item.albumid) : null}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-song", { songId: item.songid })}></kodi-cover-element>
                            <div class="search-song-title search-title">${item.artist} - ${item.title}</div>
                            <div class="search-song-genre search-genre">${item.genre ?? "undefined"}</div>
                            <div class="search-song-album search-album">${item.album} (${item.year})</div>
                            <div class="search-song-duration search-duration">
                                ${this._formatDuration(item.duration)}
                            </div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, songsStyles];
    }
}
