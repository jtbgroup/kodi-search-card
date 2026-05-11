/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor, getLovelace, hasConfigOrEntityChanged } from "custom-card-helpers";
import { localize } from "./localize/localize";

import "./editor";
import "./components/kodi-search-form";
import "./components/kodi-cover-element";
import "./components/media/kodi-media-songs";
import "./components/media/kodi-media-albums";
import "./components/media/kodi-media-albumdetail";
import "./components/media/kodi-media-seasondetail";
import "./components/media/kodi-media-simple"; // artists, movies, musicvideos, tvshows, episodes, channels, filemusicplaylist

import { KodiSearchCardConfig } from "./types";
import {
    CARD_VERSION,
    MEDIA_TYPE_PARAMS,
    MEDIA_TYPES_SINGLE_DISPLAY,
    ACTION_MAP,
    DEFAULT_ADD_POSITION,
    DEFAULT_SHOW_THUMBNAIL,
    DEFAULT_SHOW_THUMBNAIL_OVERLAY,
    DEFAULT_ACTION_MODE,
    DEFAULT_SHOW_ACTION_MODE,
    DEFAULT_SHOW_RECENTLY_ADDED,
    DEFAULT_SHOW_RECENTLY_PLAYED,
    DEFAULT_ALBUM_DETAILS_SORT,
    DEFAULT_MEDIA_TYPE_ORDER,
    DEFAULT_ENTITY_NAME,
    DEFAULT_SHOW_THUMBNAIL_BORDER,
    DEFAULT_OUTLINE_COLOR,
} from "./const";

/* eslint no-console: 0 */
console.info(
    `%c  KODI-SEARCH-CARD\n%c  ${localize("common.version")} ${CARD_VERSION}    `,
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray",
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "kodi-search-card",
    name: "Kodi Search Card",
    description: "This custom card allows you to search for media from your kodi libraries",
});

@customElement("kodi-search-card")
export class KodiSearchCard extends LitElement {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement("kodi-search-card-editor");
    }

    public static getStubConfig(): Record<string, unknown> {
        return {
            entity: DEFAULT_ENTITY_NAME,
            show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
            show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
            show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
            outline_color: DEFAULT_OUTLINE_COLOR,
            album_details_sort: DEFAULT_ALBUM_DETAILS_SORT,
            show_action_mode: DEFAULT_SHOW_ACTION_MODE,
            show_recently_added: DEFAULT_SHOW_RECENTLY_ADDED,
            show_recently_played: DEFAULT_SHOW_RECENTLY_PLAYED,
            action_mode: DEFAULT_ACTION_MODE,
            add_position: DEFAULT_ADD_POSITION,
            order: DEFAULT_MEDIA_TYPE_ORDER,
        };
    }

    @property({ attribute: false }) public hass!: HomeAssistant;
    @state() private config!: KodiSearchCardConfig;

    // Kept as instance state (not config) so action mode can be toggled inside
    // the card without touching the stored configuration.
    @state() private _actionMode = DEFAULT_ACTION_MODE;

    private _entityState: any;
    private _jsonMeta: any;
    private _serviceDomain = "";
    private _kodiEntityId = "";

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    public setConfig(config: KodiSearchCardConfig): void {
        if (!config) throw new Error(localize("common.invalid_configuration"));

        if (config.test_gui) getLovelace().setEditMode(true);

        this.config = config;
        this._actionMode = config.action_mode ?? DEFAULT_ACTION_MODE;

        document.documentElement.style.setProperty(
            "--outline_color",
            config.outline_color ?? DEFAULT_OUTLINE_COLOR,
        );
    }

    public getCardSize(): number {
        return 12;
    }

    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (!this.config) return false;
        return hasConfigOrEntityChanged(this, changedProps, false);
    }

    // ─── Service calls ───────────────────────────────────────────────────────

    private _callService(method: string, extra: Record<string, unknown> = {}): void {
        this.hass.callService(this._serviceDomain, "call_method", {
            entity_id: this.config.entity,
            method,
            ...extra,
        });
    }

    private _search(value: string): void {
        this._callService("search", { item: { media_type: "all", value } });
    }

    private _clear(): void {
        this._callService("clear");
    }

    private _recentlyAdded(): void {
        this._callService("search", { item: { media_type: "recently_added" } });
    }

    private _recentlyPlayed(): void {
        this._callService("search", { item: { media_type: "recently_played" } });
    }

    private _currentArtist(): void {
        this._callService("search", { item: { media_type: "current_artist" } });
    }

    private _browseArtist(artistId: number): void {
        this._callService("search", { item: { media_type: "artist", value: artistId } });
    }

    private _browseTvShow(tvShowId: number): void {
        this._callService("search", { item: { media_type: "tvshow", value: tvShowId } });
    }

    private _addItem(itemKey: string, itemId: unknown): void {
        const method = ACTION_MAP[this._actionMode].method;
        const position = method === "add" ? (this.config.add_position ?? 0) : DEFAULT_ADD_POSITION;
        this._callService(method, { [itemKey]: itemId, position });
    }

    // ─── Event handlers from child components ────────────────────────────────

    private _onSearch(ev: CustomEvent): void {
        this._search(ev.detail.value);
    }

    private _onClear(): void {
        this._clear();
    }

    private _onRecentlyAdded(): void {
        this._recentlyAdded();
    }

    private _onRecentlyPlayed(): void {
        this._recentlyPlayed();
    }

    private _onCurrentArtist(): void {
        this._currentArtist();
    }

    private _onActionModeChanged(ev: CustomEvent): void {
        this._actionMode = ev.detail.mode;
    }

    private _onPlaySong(ev: CustomEvent): void {
        this._addItem("songid", ev.detail.songId);
    }

    private _onPlayAlbum(ev: CustomEvent): void {
        this._addItem("albumid", ev.detail.albumId);
    }

    private _onPlayMovie(ev: CustomEvent): void {
        this._addItem("movieid", ev.detail.movieId);
    }

    private _onPlayMusicVideo(ev: CustomEvent): void {
        this._addItem("musicvideoid", ev.detail.musicVideoId);
    }

    private _onPlayEpisode(ev: CustomEvent): void {
        this._addItem("episodeid", ev.detail.episodeId);
    }

    private _onPlaySeason(ev: CustomEvent): void {
        this._addItem("episodeid", ev.detail.episodeIds);
    }

    private _onPlayChannel(ev: CustomEvent): void {
        this._addItem("channelid", ev.detail.channelId);
    }

    private _onPlayPlaylist(ev: CustomEvent): void {
        this._addItem("filemusicplaylist", ev.detail.file);
    }

    private _onBrowseArtist(ev: CustomEvent): void {
        this._browseArtist(ev.detail.artistId);
    }

    private _onBrowseTvShow(ev: CustomEvent): void {
        this._browseTvShow(ev.detail.tvShowId);
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    protected render(): TemplateResult | void {
        let errorMessage: string | undefined;
        const entity = this.config.entity;

        if (!entity) {
            errorMessage = "No Entity defined";
        } else {
            this._entityState = this.hass.states[entity];
            if (!this._entityState) {
                errorMessage = "No State for the sensor";
            } else if (this._entityState.state === "off") {
                errorMessage = "Kodi is off";
            } else {
                const meta = this._entityState.attributes.meta;
                if (!meta) return;
                this._jsonMeta = typeof meta === "object" ? meta : JSON.parse(meta);
                if (this._jsonMeta.length === 0) return;
                this._serviceDomain = this._jsonMeta[0]["service_domain"];
                this._kodiEntityId = this._jsonMeta[0]["kodi_entity_id"];
            }
        }

        return html`
            <ha-card
                .header=${this.config.title ?? ""}
                tabindex="0"
                .label=${`Kodi Search ${entity ?? "No Entity Defined"}`}>
                ${errorMessage
                    ? html`<div>${errorMessage}</div>`
                    : html`
                          <div id="card-container"
                              @kodi-search=${this._onSearch}
                              @kodi-clear=${this._onClear}
                              @kodi-recently-added=${this._onRecentlyAdded}
                              @kodi-recently-played=${this._onRecentlyPlayed}
                              @kodi-current-artist=${this._onCurrentArtist}
                              @kodi-action-mode-changed=${this._onActionModeChanged}
                              @kodi-play-song=${this._onPlaySong}
                              @kodi-play-album=${this._onPlayAlbum}
                              @kodi-play-movie=${this._onPlayMovie}
                              @kodi-play-musicvideo=${this._onPlayMusicVideo}
                              @kodi-play-episode=${this._onPlayEpisode}
                              @kodi-play-season=${this._onPlaySeason}
                              @kodi-play-channel=${this._onPlayChannel}
                              @kodi-play-playlist=${this._onPlayPlaylist}
                              @kodi-browse-artist=${this._onBrowseArtist}
                              @kodi-browse-tvshow=${this._onBrowseTvShow}>

                              <kodi-search-form
                                  .actionMode=${this._actionMode}
                                  ?showActionMode=${this.config.show_action_mode ?? DEFAULT_SHOW_ACTION_MODE}
                                  ?showRecentlyAdded=${this.config.show_recently_added ?? DEFAULT_SHOW_RECENTLY_ADDED}
                                  ?showRecentlyPlayed=${this.config.show_recently_played ?? DEFAULT_SHOW_RECENTLY_PLAYED}
                                  ?showCurrentArtist=${this.config.show_current_artist ?? false}></kodi-search-form>

                              <div id="card-container-result">
                                  ${this._renderResults()}
                              </div>
                          </div>
                      `}
            </ha-card>
        `;
    }

    private _renderResults(): TemplateResult {
        const data = this._entityState.attributes.data;
        const json: any[] = typeof data === "object" ? data : JSON.parse(data);

        if (this._jsonMeta[0]["search"] && json.length === 0) {
            return html`<div class="result-div-noresult">No result found</div>`;
        }

        const order: string[] = this.config.media_type_order ?? DEFAULT_MEDIA_TYPE_ORDER;
        const actionIcon = ACTION_MAP[this._actionMode].icon;
        const showThumbnail = this.config.show_thumbnail ?? DEFAULT_SHOW_THUMBNAIL;
        const showOverlay = this.config.show_thumbnail_overlay ?? DEFAULT_SHOW_THUMBNAIL_OVERLAY;
        const showBorder = this.config.show_thumbnail_border ?? false;

        const sharedProps = {
            actionIcon,
            showThumbnail,
            showThumbnailOverlay: showOverlay,
            showThumbnailBorder: showBorder,
            kodiEntityId: this._kodiEntityId,
            hass: this.hass,
        };

        const renderGroup = (mediaType: string): TemplateResult => {
            const items = json.filter(i => i.type === mediaType);
            if (items.length === 0) return html``;

            const { label, icon } = MEDIA_TYPE_PARAMS[mediaType];
            return html`
                <div>
                    <div class="media-type-div">
                        ${label} <ha-icon icon=${icon}></ha-icon>
                    </div>
                    ${this._renderMediaComponent(mediaType, items, sharedProps)}
                </div>
            `;
        };

        return html`
            ${order.map(renderGroup)}
            ${MEDIA_TYPES_SINGLE_DISPLAY.map(renderGroup)}
        `;
    }

    private _renderMediaComponent(
        mediaType: string,
        items: any[],
        props: Record<string, unknown>,
    ): TemplateResult {
        const { actionIcon, showThumbnail, showThumbnailOverlay, showThumbnailBorder, kodiEntityId, hass } = props as any;

        switch (mediaType) {
            case "song":
                return html`<kodi-media-songs
                    .items=${items}
                    .actionIcon=${actionIcon}
                    .kodiEntityId=${kodiEntityId}
                    .hass=${hass}
                    ?showThumbnail=${showThumbnail}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-songs>`;

            case "album":
                return html`<kodi-media-albums
                    .items=${items}
                    .actionIcon=${actionIcon}
                    .kodiEntityId=${kodiEntityId}
                    .hass=${hass}
                    ?showThumbnail=${showThumbnail}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-albums>`;

            case "artist":
                return html`<kodi-media-artists
                    .items=${items}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-artists>`;

            case "movie":
                return html`<kodi-media-movies
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-movies>`;

            case "musicvideo":
                return html`<kodi-media-musicvideos
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-musicvideos>`;

            case "tvshow":
                return html`<kodi-media-tvshows
                    .items=${items}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-tvshows>`;

            case "episode":
                return html`<kodi-media-episodes
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-episodes>`;

            case "channel":
                return html`<kodi-media-channels
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-channels>`;

            case "albumdetail":
                return html`<kodi-media-albumdetail
                    .items=${items}
                    .actionIcon=${actionIcon}
                    .kodiEntityId=${kodiEntityId}
                    .hass=${hass}
                    .sortMethod=${this.config.album_details_sort ?? DEFAULT_ALBUM_DETAILS_SORT}
                    ?showThumbnail=${showThumbnail}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-albumdetail>`;

            case "seasondetail":
                return html`<kodi-media-seasondetail
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-seasondetail>`;

            case "filemusicplaylist":
                return html`<kodi-media-filemusicplaylist
                    .items=${items}
                    .actionIcon=${actionIcon}
                    ?showThumbnailOverlay=${showThumbnailOverlay}
                    ?showThumbnailBorder=${showThumbnailBorder}></kodi-media-filemusicplaylist>`;

            default:
                return html``;
        }
    }

    // ─── Styles ──────────────────────────────────────────────────────────────

    static get styles(): CSSResultGroup {
        return css`
            :root {
                --outline_color: var(--primary-text-color);
            }

            #card-container {
                margin: 20px 10px;
                display: grid;
                grid-template-rows: auto;
                grid-template-columns: auto;
                row-gap: var(--container-main-rows-gap, 30px);
            }

            #card-container-result {
                display: grid;
                grid-template-rows: auto;
                grid-template-columns: auto;
                row-gap: var(--container-rows-gap, 10px);
            }

            .media-type-div,
            .result-div-noresult {
                font-weight: bold;
                font-size: 18px;
                text-align: right;
                border-bottom: solid;
            }
        `;
    }
}
