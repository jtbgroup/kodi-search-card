import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import { CategoryHelper } from "../services/category-helper";
import "./item-thumbnail";

@customElement("kodi-season-detail-view")
export class SeasonDetailView extends LitElement {
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

            .tvshow-detailed-view {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .season-detailed-row {
                display: flex;
                gap: 20px;
                background: #1c1c1c;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
                border: 1px solid #2d2d2d;
            }

            @media (max-width: 600px) {
                .season-detailed-row {
                    flex-direction: column;
                }
            }

            .season-detailed-thumb-container {
                width: 120px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            /* Format d'affiche verticale (2/3) pour les séries/saisons */
            .season-detailed-thumb-container kodi-item-thumbnail {
                width: 110px;
                height: 155px;
                margin-bottom: 8px;
                --thumb-ratio: 2/3;
            }

            .season-detailed-title {
                font-weight: 600;
                font-size: 0.9rem;
                color: #fff;
                line-height: 1.2;
            }

            .season-detailed-episodes-list {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .episode-item {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                border-radius: 4px;
                transition: background 0.2s;
                border-bottom: 1px solid #252525;
            }

            .episode-item:hover {
                background: #2a2a2a;
            }

            .episode-title {
                flex-grow: 1;
                color: #ffffff;
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .episode-actions {
                display: flex;
                gap: 4px;
            }

            .episode-actions ha-icon {
                --mdc-icon-size: 20px;
                padding: 4px;
                cursor: pointer;
            }

            .no-episodes-msg {
                color: #8a8a8a;
                font-style: italic;
                padding: 12px;
                font-size: 0.85rem;
            }
        `;
    }

    protected render() {
        return html`
            <div class="tvshow-detailed-view">${this.items.map(season => this._renderDetailedSeasonRow(season))}</div>
        `;
    }

    private _renderDetailedSeasonRow(season: SearchResultItem) {
        const icon = CategoryHelper.getCategoryIcon("seasons") || "mdi:television-classic";

        const actionIcon = this.searchAction === "add" ? "mdi:plus" : "mdi:play";
        const episodeActionTitle = this.searchAction === "add" ? "Add episode" : "Play episode";

        const handleSeasonClick = (e: Event) => {
            e.stopPropagation();
            this.dispatchEvent(
                new CustomEvent("item-click", {
                    detail: { item: season, category: "seasons" },
                    bubbles: false,
                    composed: true,
                }),
            );
        };

        return html`
            <div class="season-detailed-row">
                <div class="season-detailed-thumb-container">
                    <div style="cursor: pointer; width: 100%;" @click="${handleSeasonClick}">
                        <kodi-item-thumbnail
                            .item="${season}"
                            .category="${"seasons"}"
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
                    <div class="season-detailed-title">${season.title || season.label}</div>
                </div>

                <div class="season-detailed-episodes-list">
                    ${season.episodes && season.episodes.length > 0
                        ? season.episodes.map(episode => {
                              const handleEpisodeClick = (e: Event) => {
                                  e.stopPropagation();
                                  this.dispatchEvent(
                                      new CustomEvent("item-click", {
                                          detail: { item: episode, category: "episodes" },
                                          bubbles: false,
                                          composed: true,
                                      }),
                                  );
                              };

                              // Formatage conforme à l'image :ex: "1x01. Noël mortel"
                              const seasonNum = episode.season ?? season.season ?? 1;
                              const episodeNum = String(episode.episode ?? "").padStart(2, "0");
                              const displayTitle = episode.episode
                                  ? `${seasonNum}x${episodeNum}. ${episode.title || episode.label}`
                                  : episode.title || episode.label;

                              return html`
                                  <div class="episode-item">
                                      <span class="episode-title">${displayTitle}</span>
                                      <div class="episode-actions">
                                          <ha-icon
                                              .icon="${actionIcon}"
                                              .title="${episodeActionTitle}"
                                              style="cursor: pointer;"
                                              @click="${handleEpisodeClick}">
                                          </ha-icon>
                                      </div>
                                  </div>
                              `;
                          })
                        : html`<div class="no-episodes-msg">No episodes found</div>`}
                </div>
            </div>
        `;
    }
}
