import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { ALBUM_SORT } from "../../const";
import { sharedStyles } from "../../styles/shared.styles";
import { albumdetailStyles } from "../../styles/media.styles";
import "../kodi-cover-element";

/**
 * Album detail component.
 *
 * Fixes the original `document.createElement` anti-pattern in
 * `_createItemDetailsActionIcon` by using pure Lit templates with
 * `@mouseenter` / `@mouseleave` on the row rather than imperative DOM
 * manipulation.
 *
 * Emits:
 *   - "kodi-play-album" → detail: { albumId }
 *   - "kodi-play-song"  → detail: { songId }
 */
@customElement("kodi-media-albumdetail")
export class KodiMediaAlbumDetail extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property() kodiEntityId = "";
    @property() sortMethod = ALBUM_SORT.date_desc.id;
    /** When false, no thumbnail fetch is performed and the fallback icon shows. */
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;
    @property({ attribute: false }) hass!: HomeAssistant;

    /**
     * Track which song row is currently hovered — drives bold highlight via template.
     * Kodi song IDs are numbers, so the type must be number | null to allow === comparison.
     */
    @state() private _hoveredSongId: number | null = null;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
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

    private _sortedItems(): any[] {
        const copy = [...this.items];
        switch (this.sortMethod) {
            case ALBUM_SORT.date_desc.id:
                return copy.sort((a, b) => parseFloat(b.year) - parseFloat(a.year));
            case ALBUM_SORT.date_asc.id:
                return copy.sort((a, b) => parseFloat(a.year) - parseFloat(b.year));
            case ALBUM_SORT.title_asc.id:
                return copy.sort((a, b) => a.title.localeCompare(b.title));
            case ALBUM_SORT.title_desc.id:
                return copy.sort((a, b) => b.title.localeCompare(a.title));
            default:
                return copy;
        }
    }

    private _albumDuration(album: any): number {
        return (album.songs ?? []).reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0);
    }

    private _formatDuration(seconds: number): string {
        return new Date(seconds * 1000).toISOString().substring(11, 19);
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-albumsdetails-grid search-grid search-item-container-grid">
                ${this._sortedItems().map(
                    album => html`
                        <div class="search-albumdetails-grid search-grid">
                            <kodi-cover-element
                                class="search-albumdetails-cover"
                                coverClass="search-albumdetails-cover"
                                defaultIconClass="search-albumdetails-cover-image-default"
                                defaultIcon="mdi:disc"
                                overlayIcon=${this.actionIcon}
                                .imagePromise=${this.showThumbnail ? this._getImagePromise(album.albumid) : null}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-album", { albumId: album.albumid })}></kodi-cover-element>

                            <div class="search-albumdetails-title search-title">
                                ${album.year} - ${album.title}
                            </div>

                            <div class="search-albumdetails-songs">
                                ${(album.songs ?? []).map(
                                    (song: any) => html`
                                        <!--
                                            Pure Lit highlight: no document.createElement,
                                            no imperative style mutation.
                                            @mouseenter / @mouseleave update _hoveredSongId
                                            which drives the "highlighted" class via template.
                                        -->
                                        <div
                                            class="search-albumdetails-song-grid"
                                            @mouseenter=${() => (this._hoveredSongId = song.songid)}
                                            @mouseleave=${() => (this._hoveredSongId = null)}>
                                            <div
                                                class="search-albumdetails-song-track ${this._hoveredSongId ===
                                                song.songid
                                                    ? "highlighted"
                                                    : ""}">
                                                ${song.track ?? ""}
                                            </div>
                                            <div
                                                class="search-albumdetails-song-title ${this._hoveredSongId ===
                                                song.songid
                                                    ? "highlighted"
                                                    : ""}">
                                                ${song.title}
                                            </div>
                                            <ha-icon
                                                class="search-albumdetails-song-play"
                                                icon=${this.actionIcon}
                                                @click=${() =>
                                                    this._emit("kodi-play-song", {
                                                        songId: song.songid,
                                                    })}></ha-icon>
                                        </div>
                                    `,
                                )}
                            </div>

                            <div class="search-albumdetails-duration">
                                ${this._formatDuration(this._albumDuration(album))}
                            </div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, albumdetailStyles];
    }
}
