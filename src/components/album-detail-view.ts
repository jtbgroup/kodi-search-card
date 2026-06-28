import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import "./item-thumbnail";
import { formatDuration } from "../utils/formatters";

@customElement("kodi-album-detail-view")
export class AlbumDetailView extends LitElement {
    @property() items: SearchResultItem[] = [];
    @property() searchAction: "play" | "add" = "play";
    @property() thumbnailService?: ThumbnailService;
    @property() imageUpdateCounter = 0;

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .artist-detailed-view {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .album-detailed-row {
                display: flex;
                gap: 20px;
                background: #1c1c1c;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
                border: 1px solid #2d2d2d;
            }

            @media (max-width: 600px) {
                .album-detailed-row {
                    flex-direction: column;
                }
            }

            .album-detailed-thumb-container {
                width: 120px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .album-detailed-thumb-container kodi-item-thumbnail {
                width: 100px;
                height: 100px;
                margin-bottom: 8px;
            }

            .album-detailed-title {
                font-weight: 600;
                font-size: 0.9rem;
                color: #fff;
                line-height: 1.2;
            }

            .album-detailed-year {
                font-size: 0.8rem;
                color: #8a8a8a;
                margin-top: 2px;
            }

            .album-detailed-songs-list {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .album-song-item {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                border-radius: 4px;
                transition: background 0.2s;
                border-bottom: 1px solid #252525;
            }

            .album-song-item:hover {
                background: #2a2a2a;
            }

            .song-index {
                color: #8a8a8a;
                margin-right: 8px;
                width: 20px;
                font-size: 0.85rem;
            }

            .song-title {
                flex-grow: 1;
                color: #ffffff;
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .song-duration {
                color: #8a8a8a;
                font-size: 0.8rem;
                margin-right: 12px;
                font-family: monospace;
            }

            .song-actions {
                display: flex;
                gap: 4px;
            }

            .song-actions ha-icon {
                --mdc-icon-size: 20px;
                padding: 4px;
                cursor: pointer;
            }

            .no-songs-msg {
                color: #8a8a8a;
                font-style: italic;
                padding: 12px;
                font-size: 0.85rem;
            }
        `;
    }

    protected render() {
        return html`
            <div class="artist-detailed-view">
                ${this.items.map(album => this._renderDetailedAlbumRow(album))}
            </div>
        `;
    }

    private _renderDetailedAlbumRow(album: SearchResultItem) {
        const icon = CategoryHelper.getCategoryIcon("albums");

        let thumbnailUrl: string | undefined;
        if (this.thumbnailService) {
            thumbnailUrl = this.thumbnailService.getItemThumbnailUrl(album, "albums");
            if (thumbnailUrl && !this.thumbnailService.isCached(thumbnailUrl)) {
                this.thumbnailService.loadThumbnail(thumbnailUrl);
            }
        }

        const isCached = this.thumbnailService ? this.thumbnailService.isCached(thumbnailUrl || "") : false;
        const cachedUrl = this.thumbnailService?.getCachedThumbnail(thumbnailUrl || "");

        return html`
            <div class="album-detailed-row">
                <div class="album-detailed-thumb-container">
                    <kodi-item-thumbnail
                        .imageUrl="${cachedUrl}"
                        .icon="${icon}"
                        .isCached="${isCached}"
                        size="large"></kodi-item-thumbnail>
                    <div class="album-detailed-title">${album.title || album.label}</div>
                    ${album.year ? html`<div class="album-detailed-year">(${album.year})</div>` : ""}
                </div>

                <div class="album-detailed-songs-list">
                    ${album.songs && album.songs.length > 0
                        ? album.songs.map(
                              (song, index) => html`
                                  <div class="album-song-item">
                                      <span class="song-index">${index + 1}.</span>
                                      <span class="song-title">${song.title || song.label}</span>
                                      <span class="song-duration">${formatDuration(song.duration)}</span>

                                      <div class="song-actions">
                                          <ha-icon
                                              icon="mdi:play"
                                              title="Jouer"
                                              @click="${() => this.dispatchEvent(new CustomEvent("song-play", { detail: song }))}"></ha-icon>
                                          <ha-icon
                                              icon="mdi:plus"
                                              title="Ajouter"
                                              @click="${() => this.dispatchEvent(new CustomEvent("song-add", { detail: song }))}"></ha-icon>
                                      </div>
                                  </div>
                              `,
                          )
                        : html`<div class="no-songs-msg">Aucun morceau trouvé ou format non supporté</div>`}
                </div>
            </div>
        `;
    }
}
