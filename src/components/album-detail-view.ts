/**
 * ============================================================================
 * ALBUM DETAIL VIEW - Architecture simplifiée
 * ============================================================================
 * * Fully delegates image handling to the intelligent component.
 * <kodi-item-thumbnail>.
 */

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
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor="var(--divider-color)";

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
                padding: 3px 5px;
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
                white-space: normal;
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
            <div class="artist-detailed-view">${this.items.map(album => this._renderDetailedAlbumRow(album))}</div>
        `;
    }

    private _renderDetailedAlbumRow(album: SearchResultItem) {
        const icon = CategoryHelper.getCategoryIcon("albums");

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
