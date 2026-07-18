import { LitElement, html, css, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchActionType, SearchResultItem } from "../types";
import { ThumbnailService } from "../services/thumbnail-service";
import "./item-thumbnail";
import { getCategoryIcon } from "../utils/formatters";
import { ACTION_MAP, CATEGORY_SEASONS } from "../const";
import { seasonDetailCSS } from "../styles/season-detail-view.style";

@customElement("kodi-season-detail-view")
export class SeasonDetailView extends LitElement {
    @property() items: SearchResultItem[] = [];
   @property({ type: String }) searchAction: SearchActionType = ACTION_MAP.play.id;
    @property() thumbnailService?: ThumbnailService;
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnail = true;
    @property({ type: Boolean }) showThumbnailBorder? = true;
    @property({ type: String }) outlineColor = "var(--divider-color)";

    static get styles(): CSSResultGroup {
        return [seasonDetailCSS];
    }

    protected render() {
        return html`
            <div class="tvshow-detailed-view">${this.items.map(season => this._renderDetailedSeasonRow(season))}</div>
        `;
    }

    private _renderDetailedSeasonRow(season: SearchResultItem) {
        const icon = getCategoryIcon(CATEGORY_SEASONS) || "mdi:television-classic";

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

                              // Formatting matching the image, e.g. "1x01. Fatal Christmas"
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

