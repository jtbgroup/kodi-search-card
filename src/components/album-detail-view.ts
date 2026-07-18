/**
 * ============================================================================
 * ALBUM DETAIL VIEW - Architecture simplifiée
 * ============================================================================
 * * Fully delegates image handling to the intelligent component.
 * <kodi-item-thumbnail>.
 */

import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchActionType, SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { formatDuration, getCategoryIcon } from "../utils/formatters";
import "./item-thumbnail";
import { albumDetailViewCSS } from "../styles/album-detail-view.style"
import { ACTION_MAP } from "../const";

@customElement("kodi-album-detail-view")
export class AlbumDetailView extends LitElement {
    @property() items: SearchResultItem[] = [];
     @property({ type: String }) searchAction: SearchActionType = ACTION_MAP.play.id;
    @property() thumbnailService?: ThumbnailService;
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor="var(--divider-color)";

   static get styles(): CSSResultGroup {
        return [albumDetailViewCSS];
    }

    protected render() {
        return html`
            <div class="artist-detailed-view">${this.items.map(album => this._renderDetailedAlbumRow(album))}</div>
        `;
    }

    private _renderDetailedAlbumRow(album: SearchResultItem) {
        const icon = getCategoryIcon("albums");

        // Determine the icon and title based on the global controls.
        const actionIcon = this.searchAction === "add" ? "mdi:plus" : "mdi:play";
        const actionTitle = this.searchAction === "add" ? "Add album" : "Play album";
        const songActionTitle = this.searchAction === "add" ? "Add Song" : "Play song";

        // Action on album cover click.
        const handleAlbumClick = (e: Event) => {
            e.stopPropagation();
            this.dispatchEvent(
                new CustomEvent("item-click", {
                    detail: { item: album, category: "albums" },
                    bubbles: false,
                    composed: true,
                }),
            );
        };

        return html`
            <div class="album-detailed-row">
                <div class="album-detailed-thumb-container">
                    <div style="cursor: pointer; width: 100%;" @click="${handleAlbumClick}">
                        <kodi-item-thumbnail
                            .item="${album}"
                            .category="${"albums"}"
                            .thumbnailService="${this.thumbnailService}"
                            .icon="${icon}"
                            size="large"
                            .showThumbnailOverlay="${this.showThumbnailOverlay}"
                            .showThumbnail="${this.showThumbnail}"
                            .outlineColor="${this.outlineColor}"
                            .showThumbnailBorder="${this.showThumbnailBorder}"
                            .actionIcon="${actionIcon}">
                        </kodi-item-thumbnail>
                    </div>
                    <div class="album-detailed-title">${album.title || album.label}</div>
                    ${album.year ? html`<div class="album-detailed-year">(${album.year})</div>` : ""}
                </div>

                <div class="album-detailed-songs-list">
                    ${album.songs && album.songs.length > 0
                        ? album.songs.map((song, index) => {
                              // Action on song icon click.
                              const handleSongClick = (e: Event) => {
                                  e.stopPropagation();
                                  this.dispatchEvent(
                                      new CustomEvent("item-click", {
                                          detail: { item: song, category: "songs" },
                                          bubbles: false,
                                          composed: true,
                                      }),
                                  );
                              };

                              return html`
                                  <div class="album-song-item">
                                      <span class="song-index">${index + 1}.</span>
                                      <span class="song-title">${song.title || song.label}</span>
                                      <span class="song-duration">${formatDuration(song.duration)}</span>

                                      <div class="song-actions">
                                          <ha-icon
                                              .icon="${actionIcon}"
                                              .title="${songActionTitle}"
                                              style="cursor: pointer;"
                                              @click="${handleSongClick}">
                                          </ha-icon>
                                      </div>
                                  </div>
                              `;
                          })
                        : html`<div class="no-songs-msg">No tracks found or format not supported</div>`}
                </div>
            </div>
        `;
    }
}

export {};
