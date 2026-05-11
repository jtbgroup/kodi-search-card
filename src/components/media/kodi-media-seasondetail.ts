import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../../styles/shared.styles";
import { seasondetailStyles } from "../../styles/media.styles";
import "../kodi-cover-element";

/**
 * Season detail component.
 *
 * Emits:
 *   - "kodi-play-season"  → detail: { episodeIds: number[] }  (whole season)
 *   - "kodi-play-episode" → detail: { episodeId: number }     (single episode)
 */
@customElement("kodi-media-seasondetail")
export class KodiMediaSeasonDetail extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    /** Kodi episode IDs are numbers; must be number | null for === to work. */
    @state() private _hoveredEpisodeId: number | null = null;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div>
                ${this.items.map(season => {
                    const imageUrl = season.poster || season.thumbnail || "";
                    const episodeIds = (season.episodes ?? []).map((e: any) => e.episodeid);
                    return html`
                        <div class="search-seasondetails-grid search-grid search-item-container-grid">
                            <kodi-cover-element
                                class="search-seasondetails-cover"
                                coverClass="search-seasondetails-cover"
                                defaultIconClass="search-seasondetails-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon=${this.actionIcon}
                                imageUrl=${imageUrl}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-season", { episodeIds })}></kodi-cover-element>

                            <div class="search-seasondetails-title search-title">${season.title}</div>

                            <div class="search-seasondetails-episodes">
                                ${(season.episodes ?? []).map(
                                    (episode: any) => html`
                                        <div
                                            class="search-seasondetails-episode-grid"
                                            @mouseenter=${() => (this._hoveredEpisodeId = episode.episodeid)}
                                            @mouseleave=${() => (this._hoveredEpisodeId = null)}>
                                            <div
                                                class="search-seasondetails-episode-track ${this
                                                    ._hoveredEpisodeId === episode.episodeid
                                                    ? "highlighted"
                                                    : ""}">
                                                ${episode.season && episode.episode
                                                    ? `${episode.season}x${episode.episode.toString().padStart(2, "0")}.`
                                                    : ""}
                                            </div>
                                            <div
                                                class="search-seasondetails-episode-title ${this
                                                    ._hoveredEpisodeId === episode.episodeid
                                                    ? "highlighted"
                                                    : ""}">
                                                ${episode.title}
                                            </div>
                                            <ha-icon
                                                class="search-seasondetails-episode-play"
                                                icon=${this.actionIcon}
                                                @click=${() =>
                                                    this._emit("kodi-play-episode", {
                                                        episodeId: episode.episodeid,
                                                    })}></ha-icon>
                                        </div>
                                    `,
                                )}
                            </div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, seasondetailStyles];
    }
}
