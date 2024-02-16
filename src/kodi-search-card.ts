/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { HomeAssistant, LovelaceCardEditor, getLovelace, hasConfigOrEntityChanged } from "custom-card-helpers";
import { localize } from "./localize/localize";
import { until } from "lit/directives/until";

import "./editor";
import type { KodiSearchCardConfig } from "./types";
import {
    CARD_VERSION,
    MEDIA_TYPE_PARAMS,
    MEDIA_TYPES_SINGLE_DISPLAY,
    ALBUM_SORT,
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

// This puts your card into the UI card picker dialog
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

    private _render_finished = false;
    private _searchInput;

    private _entityState;
    private _json_meta;
    private _service_domain;
    private _kodi_entity_id;
    // this is the only config property to be kept because we do not want to change the configuration when switching the action mode in the card (only in the editor)
    private _config_action_mode = DEFAULT_ACTION_MODE;

    // TODO Add any properities that should cause your element to re-render here
    // https://lit.dev/docs/components/properties/
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private config!: KodiSearchCardConfig;

    public setConfig(config: KodiSearchCardConfig): void {
        // TODO Check for required fields and that they are of the proper format
        if (!config) {
            throw new Error(localize("common.invalid_configuration"));
        }

        if (config.test_gui) {
            getLovelace().setEditMode(true);
        }

        this.config = config;

        if (this.config.action_mode) {
            this._config_action_mode = this.config.action_mode;
        }
        document.documentElement.style.setProperty(
            `--outline_color`,
            this.config.outline_color ? this.config.outline_color : DEFAULT_OUTLINE_COLOR,
        );
    }

    public getCardSize(): number {
        return 12;
    }

    // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (!this.config) {
            return false;
        }

        return hasConfigOrEntityChanged(this, changedProps, false);
    }

    // https://lit.dev/docs/components/rendering/
    protected render(): TemplateResult | void {
        this._render_finished = false;
        let errorCardMessage;
        const entity = this.config.entity;
        if (!entity) {
            errorCardMessage = "No Entity defined";
            console.error(errorCardMessage);
        } else {
            this._entityState = this.hass.states[entity];
            if (!this._entityState) {
                errorCardMessage = "No State for the sensor";
                console.error(errorCardMessage);
            } else {
                if (this._entityState.state == "off") {
                    errorCardMessage = "Kodi is off";
                    console.error(errorCardMessage);
                } else {
                    const meta = this._entityState.attributes.meta;
                    if (!meta) {
                        console.error("no metadata for the sensor");
                        return;
                    }
                    this._json_meta = typeof meta == "object" ? meta : JSON.parse(meta);
                    if (this._json_meta.length == 0) {
                        console.error("empty metadata attribute");
                        return;
                    }
                    this._service_domain = this._json_meta[0]["service_domain"];
                    this._kodi_entity_id = this._json_meta[0]["kodi_entity_id"];
                }
            }
        }

        const card = html`
            <ha-card
                .header=${this.config.title ? this.config.title : ""}
                tabindex="0"
                .label=${`Kodi Search ${this.config.entity || "No Entity Defined"}`}>
                ${errorCardMessage ? html`<div>${errorCardMessage}</div>` : this._buildCardContainer()}
            </ha-card>
        `;
        this._render_finished = true;
        return card;
    }
    private _buildCardContainer() {
        return html`<div id="card-container">
            <div>${this._buildSearchForm()}</div>
            <div>${this._buildResultContainer()}</div>
        </div>`;
    }

    private _buildResultContainer() {
        const data = this._entityState.attributes.data;
        const json = typeof data == "object" ? data : JSON.parse(data);

        if (this._json_meta[0]["search"] && json.length == 0) {
            return html` <div id="card-container-result">${this._buildNoResultContainer()}</div>`;
        } else {
            return html` <div id="card-container-result">${this._buildDataResultContainer(json)}</div>`;
        }
    }

    private _buildNoResultContainer() {
        return html`<div class="result-div-noresult">No result found</div>`;
    }

    private _buildDataResultContainer(json) {
        const media_type_order = this.config.media_type_order ? this.config.media_type_order : DEFAULT_MEDIA_TYPE_ORDER;
        return html`
            ${media_type_order.map(media_type => this._fillMediaItems(media_type, json))}
            ${MEDIA_TYPES_SINGLE_DISPLAY.map(media_type => this._fillMediaItems(media_type, json))}
        `;
    }

    private _fillMediaItems(media_type, json) {
        const filtered = this._filterTypes(json, media_type);
        if (filtered.length > 0) {
            return html`<div>
                <div class="media-type-div">
                    ${this._getMediaTypeLabel(media_type)}
                    <ha-icon icon=${this._getMediaTypeIcon(media_type)}></ha-icon>
                </div>
                ${this._fillMediaItemData(media_type, filtered)}
            </div>`;
        }
        return html``;
    }

    private _fillMediaItemData(media_type, items) {
        switch (media_type) {
            case MEDIA_TYPE_PARAMS.song.id:
                return this._fillSongs(items);
            case MEDIA_TYPE_PARAMS.album.id:
                return this._fillAlbums(items);
            case MEDIA_TYPE_PARAMS.artist.id:
                return this._fillArtists(items);
            case MEDIA_TYPE_PARAMS.channel.id:
                return this._fillChannels(items);
            case MEDIA_TYPE_PARAMS.episode.id:
                return this._fillEpisodes(items);
            case MEDIA_TYPE_PARAMS.movie.id:
                return this._fillMovies(items);
            case MEDIA_TYPE_PARAMS.musicvideo.id:
                return this._fillMusicVideos(items);
            case MEDIA_TYPE_PARAMS.tvshow.id:
                return this._fillTvShows(items);
            case MEDIA_TYPE_PARAMS.seasondetail.id:
                return this._fillTVShowSeasonDetails(items);
            case MEDIA_TYPE_PARAMS.albumdetail.id:
                return this._fillAlbumDetails(items);
            case MEDIA_TYPE_PARAMS.filemusicplaylist.id:
                return this._fillFileMusicPlaylist(items);
        }
        return html``;
    }

    private _createCoverElement(
        image_url,
        class_cover,
        class_cover_image_default,
        icon_overlay,
        icon_default,
        action_click,
    ) {
        const class_cover_div = class_cover + " search-item-cover" + (this.config.show_thumbnail_border ? " cover-image-outline-border" : "");

        let cover_api = false;
        let cover_image = image_url;
        if (image_url != null && image_url != "" && image_url.startsWith("/api")){
            cover_image =   image_url ? this._getThumbnailURLorBase64(image_url).then((value) => `url(${value})`) : "none";
            cover_api = true;
        }

        const class_cover_container_div = "search-item-cover-container";
        const class_default_image = class_cover_image_default + " search-item-cover-image-default";
        const class_cover_image = "search-item-cover-image";

        return html`
        <div class=${class_cover_div}>
            <div class=${class_cover_container_div}>
                <ha-icon icon=${icon_default} class=${class_default_image}></ha-icon>

                ${
                    cover_image != null && cover_image != "" ?
                        (cover_api?
                        html`<div class="${class_cover_image}" @click="${this.config.show_thumbnail_overlay?'':action_click}" style="background-size: contain; background-image: ${until(cover_image, "")}"></div>`:
                        html`<img class="${class_cover_image}" @click="${this.config.show_thumbnail_overlay?'':action_click}" src="${cover_image}"></img>`
                   ) : html`<div class="${class_cover_image}" @click="${this.config.show_thumbnail_overlay?'':action_click}"></div>`}

                ${this.config.show_thumbnail_overlay ? html`<ha-icon class="overlay-play" icon=${icon_overlay} @click="${action_click}"></ha-icon>`:html``}
            </div>
        </div>
        `
    }


    private _createMusicVideoCover(item) {
        const to_search = "image://";
        let image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        image_url = decodeURIComponent(decodeURI(image_url));

        if(image_url.indexOf(to_search) > 0){
            const index = image_url.indexOf(to_search)+to_search.length;
            const last_slash = image_url.endsWith("/");
            if (image_url.endsWith("/")){
                image_url = image_url.substring(index, image_url.length-1);
            }else{
                image_url = image_url.substring(index);
            }
        }

        const class_cover = "search-musicvideo-cover";
        const class_cover_image_default =  "search-musicvideo-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addMusicVideo(item["musicvideoid"]))
    }

    private _createFileMusicPlaylistCover(item) {
        const image_url = null;
        const class_cover = "search-filemusicplaylist-cover";
        const class_cover_image_default =  "search-filemusicplaylist-cover-image-default";
        const icon_default = "mdi:disc";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addMusicPlaylist(item["file"]))
    }

    private _createChannelCover(item) {
        const image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        const class_cover = "search-channel-cover";
        const class_cover_image_default =  "search-channel-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addChannel(item["channelid"]))
    }

    private _createAlbumDetailsCover(item) {
        const image_url = "/api/media_player_proxy/"+this._kodi_entity_id+"/browse_media/album/"+item["albumid"];
        const class_cover = "search-albumdetails-cover";
        const class_cover_image_default =  "search-albumdetails-cover-image-default";
        const icon_default = "mdi:disc";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addAlbum(item["albumid"]))
    }

    private _createTvShowSeasonDetailsCover(item) {
        const image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        const class_cover = "search-seasondetails-cover";
        const class_cover_image_default =  "search-seasondetails-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addEpisodes(item["episodes"].map(x => x.episodeid)))
    }

    private _createEpisodeCover(item) {
        const to_search = "image://";
        let image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        image_url = decodeURIComponent(decodeURI(image_url));

        if(image_url.indexOf(to_search) > 0){
            const index = image_url.indexOf(to_search)+to_search.length;
            const last_slash = image_url.endsWith("/");
            if (image_url.endsWith("/")){
                image_url = image_url.substring(index, image_url.length-1);
            }else{
                image_url = image_url.substring(index);
            }
        }

        const class_cover = "search-episode-cover";
        const class_cover_image_default =  "search-episode-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addEpisode(item["episodeid"]))
    }

    private _createTvShowCover(item) {
        const image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        const class_cover = "search-tvshow-cover";
        const class_cover_image_default =  "search-tvshow-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = "mdi:menu";
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._searchMoreOfTvShow(item["tvshowid"]))
    }

    private _createMovieCover(item) {
        const image_url = item["poster"] && item["poster"] != "" ? item["poster"] : item["thumbnail"];
        const class_cover = "search-movie-cover";
        const class_cover_image_default =  "search-movie-cover-image-default";
        const icon_default = "mdi:movie";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addMovie(item["movieid"]))
    }

    private _createArtistCover(item) {
        const image_url = null;
        const class_cover = "search-artist-cover";
        const class_cover_image_default =  "search-artist-cover-image-default";
        const icon_default = "mdi:microphone";
        const icon_overlay = "mdi:menu";
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._searchMoreOfArtist(item["artistid"]))
    }

    private _createAlbumCover(item) {
        const image_url = "/api/media_player_proxy/"+this._kodi_entity_id+"/browse_media/album/"+item["albumid"];
        const class_cover = "search-album-cover";
        const class_cover_image_default =  "search-album-cover-image-default";
        const icon_default = "mdi:disc";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addAlbum(item["albumid"]))
    }

    private _createSongCover(item) {
        let image_url ="";
        if(item["thumbnail"]){
            image_url = "/api/media_player_proxy/"+this._kodi_entity_id+"/browse_media/album/"+item["albumid"];
        }
        const class_cover = "search-song-cover";
        const class_cover_image_default =  "search-song-cover-image-default";
        const icon_default = "mdi:music";
        const icon_overlay = this._getActionIcon();
        return this._createCoverElement (image_url, class_cover,class_cover_image_default, icon_overlay, icon_default, () => this._addSong(item["songid"]))
    }

    // For more example on implementation, see https://github.com/home-assistant/frontend/blob/dev/src/components/media-player/ha-media-player-browse.ts#L675
    private _getThumbnailURLorBase64(thumbnailUrl){
        if (thumbnailUrl.startsWith("/")) {
            // Thumbnails served by local API require authentication
            return new Promise((resolve, reject) => {
            this.hass
                .fetchWithAuth(thumbnailUrl!)
                // Since we are fetching with an authorization header, we cannot just put the
                // URL directly into the document; we need to embed the image. We could do this
                // using blob URLs, but then we would need to keep track of them in order to
                // release them properly. Instead, we embed the thumbnail using base64.
                .then((response) => response.blob())
                .then((blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    resolve(typeof result === "string" ? result : "");
                };
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(blob);
                });
            });
        }

        return thumbnailUrl;
    }

    private _fillChannels(items) {
        const tvchannels = items.filter(item => {
            return item.channeltype == "tv";
        });

        const radiochannels = items.filter(item => {
            return item.channeltype == "radio";
        });

        return html`${tvchannels.length > 0 ? this._fillChannel(tvchannels, "tv") : ""}
        ${radiochannels.length > 0 ? this._fillChannel(radiochannels, "radio") : ""}`;
    }
    private _fillChannel(items, type) {
        return html`
            <div class="search-channels-channeltype">
                ${type == "tv" ? "TV Channels" : "Radio Channels"} &amp&amp;&amp;
            </div>

            <div class="search-channels-grid search-grid search-item-container-grid">
                ${items.map(
                    item =>
                        html`<div class="search-channel-grid">
                            ${this._createChannelCover(item)}
                            <div class="search-channel-title search-title">${item["label"]}</div>
                            <div class="search-channel-type search-genre">
                                ${item["channeltype"]} ( nr ${item["channelnumber"]})
                            </div>
                        </div>`,
                )}
            </div>
        `;
    }

    private _fillFileMusicPlaylist(items) {
        return html`<div class="search-filemusicplaylists-grid search-grid search-item-container-grid">
            ${items.map(
                item => html`<div class="search-filemusicplaylist-grid">
                    ${this._createFileMusicPlaylistCover(item)}
                    <div class="search-filemusicplaylist-label search-title">${item["label"]}</div>
                    <div class="search-filemusicplaylist-title">${item["file"]}</div>
                </div>`,

            )}
        </div>`;
    }

    private _fillSongs(items) {
        return html`<div class="search-songs-grid search-grid search-item-container-grid">
        ${items.map(
            item => html`<div class="search-song-grid">
                    ${this._createSongCover(item)}
                    <div class="search-song-title search-title">${item["artist"]} - ${item["title"]}</div>
                    <div class="search-song-genre search-genre">${item["genre"] ? item["genre"] : "undefined"}</div>
                    <div class="search-song-album search-album">${item["album"]} (${item["year"]})</div>
                    <div class="search-song-duration search-duration">${this._formatDuration(item["duration"])}</div>
                </div>`,
            )}
        </div>`;
    }

    private _formatDuration(duration) {
        return new Date(duration * 1000).toISOString().substring(11, 19);
    }

    private _fillArtists(items) {
        return html`<div class="search-artists-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-artist-grid">
                        ${this._createArtistCover(item)}
                       <div class='search-artist-title search-title'>${item["artist"]}</div>
                </div>
              </div>`,
            )}
        </div> `;
    }

    private _fillAlbums(items) {
        return html`<div class="search-albums-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-album-grid">
                            ${this._createAlbumCover(item)}
                            <div class="search-album-title search-title">${item["title"]}</div>
                            <div class="search-album-artist search-artist">${item["artist"] + " (" + item["year"] + ")"}</div>
                        </div>
                    </div>`,
            )}
        </div> `;
    }

    private _fillMovies(items) {
        return html`<div class="search-movies-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-movie-grid">
                        ${this._createMovieCover(item)}
                        <div class="search-movie-title search-title">${item["title"]}</div>
                        <div class="search-movie-genre search-genre">${item["genre"]} (${item["year"]})</div>
                    </div>`,
            )}
        </div> `;
    }

    private _fillMusicVideos(items) {
        return html`<div class="search-musicvideos-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-musicvideo-grid">
                        ${this._createMusicVideoCover(item)}
                        <div class="search-musicvideo-artist search-title">${item["artist"]}</div>
                        <div class="search-musicvideo-title">${item["title"]} (${item["year"]})</div>
                    </div>`,
            )}
        </div> `;
    }

    private _fillEpisodes(items) {
        return html`<div class="search-episodes-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-episode-grid">
                         ${this._createEpisodeCover(item)}
                        <div class="search-episode-title search-title">${item["title"]}</div>
                        <div class="search-episode-tvshow search-tvshow">
                            ${item["tvshowtitle"]}
                            (S${item["season"].toString().padStart(2, "0")}:E${item["episode"]
                                .toString()
                                .padStart(2, "0")})
                        </div>
                        <div class="search-episode-genre search-genre">${item["genre"]}</div>
                    </div>`,
            )}
        </div> `;
    }

    private _fillTvShows(items) {
        return html`<div class="search-tvshows-grid search-grid search-item-container-grid">
            ${items.map(
                item =>
                    html`<div class="search-tvshow-grid">
                        ${this._createTvShowCover(item)}
                        <div class="search-tvshow-title search-title">${item["title"]}</div>
                        <div class="search-tvshow-genre search-genre">${item["genre"]} (${item["year"]})</div>
                    </div>`,
            )}
        </div> `;
    }

    private _fillTVShowSeasonDetails(items) {
        return html`
            <div>
                ${items.map(
                    season =>
                        html`<div class="search-seasondetails-grid  search-grid search-item-container-grid">
                            ${this._createTvShowSeasonDetailsCover(season)}
                            <div class="search-seasondetails-title search-title">${season["title"]}</div>

                            <div class="search-seasondetails-episodes">
                                ${season["episodes"].map(
                                    episode => html` <div class="search-seasondetails-episode-grid">
                                        <div
                                            class="search-seasondetails-episode-track"
                                            id="episode-track-${episode["episodeid"]}">
                                            ${episode["season"] && episode["episode"]
                                                ? episode["season"] +
                                                  "x" +
                                                  episode["episode"].toString().padStart(2, "0") +
                                                  "."
                                                : ""}
                                        </div>

                                        <div
                                            class="search-seasondetails-episode-title"
                                            id="episode-title-${episode["episodeid"]}">
                                            ${episode["title"]}
                                        </div>
                                        ${this._createItemDetailsActionIcon(
                                            () => this._addEpisodes(episode["episodeid"]),
                                            "search-seasondetails-episode-play",
                                            [
                                                "episode-title-" + episode["episodeid"],
                                                "episode-track-" + episode["episodeid"],
                                            ],
                                        )}
                                    </div>`,
                                )}
                            </div>
                        </div>`,
                )}
            </div>
        `;
    }

    private _fillAlbumDetails(items) {
        const sortMethod = this.config.album_details_sort;
        switch (sortMethod) {
            case ALBUM_SORT.date_desc.id:
                items.sort((a, b) => parseFloat(b.year) - parseFloat(a.year));
                break;
            case ALBUM_SORT.date_asc.id:
                items.sort((a, b) => parseFloat(a.year) - parseFloat(b.year));
                break;
            case ALBUM_SORT.title_asc.id:
                items.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case ALBUM_SORT.title_desc.id:
                items.sort((a, b) => b.title.localeCompare(a.title));
        }

        const albumDurations = {};
        let albumDuration = 0;
        items.map(album => {
            album["songs"].map(song => {
                albumDuration += song["duration"];
            });
            albumDurations[album["albumid"]] = albumDuration;
            albumDuration = 0;
        });

        return html`
            <div class="search-albumsdetails-grid search-grid search-item-container-grid">
                ${items.map(
                    album =>
                        html`<div class="search-albumdetails-grid  search-grid">
                            ${this._createAlbumDetailsCover(album)}
                            <div class="search-albumdetails-title search-title">
                                ${album["year"]} - ${album["title"]}
                            </div>
                            <div class="search-albumdetails-songs">
                                ${album["songs"].map(
                                    song => html` <div class="search-albumdetails-song-grid">
                                        <div class="search-albumdetails-song-track" id="song-track-${song["songid"]}">
                                            ${song["track"] ? song["track"] : ""}
                                        </div>
                                        <div class="search-albumdetails-song-title" id="song-title-${song["songid"]}">
                                            ${song["title"]}
                                        </div>
                                        ${this._createItemDetailsActionIcon(
                                            () => this._addSong(song["songid"]),
                                            "search-albumdetails-song-play",
                                            ["song-title-" + song["songid"], "song-track-" + song["songid"]],
                                        )}
                                    </div>`,
                                )}
                            </div>
                            <div class="search-albumdetails-duration">
                                ${this._formatDuration(albumDurations[album["albumid"]])}
                            </div>
                        </div>`,
                )}
            </div>
        `;
    }
    private _createItemDetailsActionIcon(clickAction, clickActionClass, higlightedElements) {
        const playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", this._getActionIcon());
        playDiv.setAttribute("class", clickActionClass);

        playDiv.addEventListener("click", clickAction);

        playDiv.addEventListener("mouseover", () => this._highlightOver(higlightedElements, true));
        playDiv.addEventListener("mouseout", () => this._highlightOver(higlightedElements, false));

        return html`${playDiv}`;
    }

    private _highlightOver(els, enabled) {
        for (let index = 0; index < els.length; index++) {
            const div = this.shadowRoot?.getElementById(els[index]);

            if (div) {
                // let color = 'var(--paper-item-icon-color, #44739e)';
                let weight = "bold";
                if (!enabled) {
                    // color = '';
                    weight = "normal";
                }
                div.style.fontWeight = weight;
            } else {
                console.error("can't find element " + els[index]);
            }
        }
    }

    // private _prepareCover(
    //     cover,
    //     class_cover,
    //     class_cover_image,
    //     class_cover_image_default,
    //     icon_overlay,
    //     icon_default,
    //     action_click,
    // ) {
    //     const border = this.config.show_thumbnail_border ? "cover-image-outline-border" : "";
    //     const coverDiv = document.createElement("div");
    //     coverDiv.setAttribute("class", class_cover);

    //     const coverContainer = document.createElement("div");
    //     coverContainer.setAttribute("class", "search-item-cover");
    //     coverDiv.appendChild(coverContainer);
    //     if (this.config.show_thumbnail && cover && cover != "") {
    //         const coverImg = document.createElement("img");
    //         coverImg.setAttribute("src", cover);
    //         coverImg.onerror = function () {
    //             coverImg.remove();

    //             const coverImgDefault = document.createElement("ha-icon");
    //             coverImgDefault.setAttribute(
    //                 "class",
    //                 "search-cover-image-default " + class_cover_image_default + " " + border,
    //             );
    //             coverImgDefault.setAttribute("icon", icon_default);
    //             coverContainer.appendChild(coverImgDefault);
    //         };
    //         coverImg.setAttribute("class", class_cover_image + " search-cover-image" + " " + border);
    //         coverContainer.appendChild(coverImg);
    //     } else {
    //         const coverImgDefault = document.createElement("ha-icon");
    //         coverImgDefault.setAttribute(
    //             "class",
    //             "search-cover-image-default " + class_cover_image_default + " " + border,
    //         );
    //         coverImgDefault.setAttribute("icon", icon_default);
    //         coverContainer.appendChild(coverImgDefault);
    //     }

    //     if (!this.config.show_thumbnail_overlay) {
    //         coverContainer.addEventListener("click", action_click);
    //     } else {
    //         const overlayImg = document.createElement("ha-icon");
    //         overlayImg.setAttribute("class", "overlay-play");
    //         overlayImg.setAttribute("icon", icon_overlay);
    //         overlayImg.addEventListener("click", action_click);
    //         coverContainer.appendChild(overlayImg);
    //     }

    //     return html`${coverDiv}`;
    // }

    private _getActionIcon() {
        return ACTION_MAP[this._config_action_mode].icon;
    }

    private _getMediaTypeIcon(media_type) {
        return MEDIA_TYPE_PARAMS[media_type].icon;
    }
    private _getMediaTypeLabel(media_type) {
        return MEDIA_TYPE_PARAMS[media_type].label;
    }

    private _filterTypes(json, value) {
        const result = json.filter(item => {
            return item.type == value;
        });

        return result;
    }

    private _buildSearchForm() {
        this._searchInput = document.createElement("ha-textfield");
        this._searchInput.setAttribute("outlined", "");
        this._searchInput.setAttribute("label", "Search criteria");
        this._searchInput.setAttribute("class", "form-button");
        this._searchInput.addEventListener("keydown", event => {
            if (event.code === "Enter") {
                this._search();
            }
        });

        return html`
            <div id="search-form-controls-grid">
                <div class="search-form-controls-fields-grid">
                    ${this._searchInput}
                    ${this.config.show_action_mode
                        ? html`<ha-select @selected=${this._actionModeChanged} @closed=${ev => ev.stopPropagation()}
                                  class="form-button"
                                  outlined
                                  label="Action mode"
                                  .value=${this._config_action_mode}>
                                  ${Object.keys(ACTION_MAP).map(
                                      action =>
                                          html`<mwc-list-item value=${action}
                                              >${ACTION_MAP[action].label}</mwc-list-item
                                          >`,
                                  )}
                              </ha-select>
                          `
                        : ``}
                </div>
                <div class="search-form-controls-buttons-grid">
                    <mwc-button class="form-button" label="Search" raised @click="${this._search}" }></mwc-button>
                    <mwc-button class="form-button" label="Clear" raised @click="${this._clear}"></mwc-button>
                    ${this.config.show_recently_added
                        ? html`<mwc-button
                              class="form-button"
                              label="Recently added"
                              raised
                              @click="${this._recently_added}"></mwc-button>`
                        : ``}
                    ${this.config.show_recently_played
                        ? html` <mwc-button
                              class="form-button"
                              label="Recently played"
                              raised
                              @click="${this._recently_played}"></mwc-button>`
                        : ``}
                    ${this.config.show_current_artist
                        ? html` <mwc-button
                              class="form-button"
                              label="Current Artist"
                              raised
                              @click="${this._current_artist}"></mwc-button>`
                        : ``}
                </div>
            </div>
        `;
    }

    private _current_artist(){this.hass.callService(this._service_domain, "call_method", {
        entity_id: this.config.entity,
        method: "search",
        item: {
            media_type: "current_artist",
        },
    });
    }

    private _actionModeChanged(event) {
        if (this._render_finished) {
            if (event.target.value) {
                const value = event.target.value;
                this._config_action_mode = value;
                this.render();
                this.requestUpdate();
            }
        }
    }

    // https://lit.dev/docs/components/styles/
    static get styles(): CSSResultGroup {
        return css`
            :root {
                --outline_color: "-----";
            }

            :host {
                --album-thumbnail-width: 130px;
                --song-thumbnail-width: 65px;
                --movie-thumbnail-width: 150px;
                --movie-thumbnail-ratio: 0.8;
                --musicvideo-thumbnail-width: 120px;
                --musicvideo-thumbnail-ratio: 1;
                --channel-thumbnail-width: 180px;
                --channel-thumbnail-ratio: 1.5;
                --artist-thumbnail-width: 130px;
                --episode-thumbnail-width: 180px;
                --episode-thumbnail-ratio: 1.5;
                --background-basic-color: #9b9595;
                --container-rows-gap: 10px;
                --container-main-rows-gap: 30px;
                --mdc-select-fill-color: rgba(0, 0, 0, 0);
            }

            /*
                -----------------
                ----- COMMON -----
                -----------------
              */
            .media-type-div,
            .result-div-noresult {
                font-weight: bold;
                font-size: 18px;
                text-align: right;
                border-bottom: solid;
            }


            .cover-image-outline-border {
                border: 1px solid var(--outline_color);
            }


            .overlay-play {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                color: white;
                transition: 0.5s ease opacity;
                text-align: center;
                --mdc-icon-size: 50px;
            }

            .search-cover-image {
                height: auto !important;
                display: block;
                justify-content: center;
            }

            .search-cover-image-default {
                display: flex;
                justify-content: flex-end;
                align-items: flex-end;
                color: white;
                background-color: var(--background-basic-color);
            }

            .search-title {
                font-weight: bold;
                font-size: 14px;
                vertical-align: text-top;
            }

            .search-duration {
                text-align: right;
            }
            .search-genre {
                font-style: italic;
                vertical-align: text-top;
            }

            .search-grid {
                display: grid;
                column-gap: 10px;
                row-gap: 10px;
            }

            .search-item-container-grid {
                padding: 10px;
            }

            .search-detail-highlighted {
                background: red;
            }

            .search-detail-normal {
                background: green;
            }

            #card-container {
                margin-top: 20px;
                margin-bottom: 20px;
                margin-left: 10px;
                margin-right: 10px;

                display: grid;
                grid-template-rows: auto;
                grid-template-columns: auto;
                row-gap: var(--container-main-rows-gap);
                /* row-gap: var(--container-rows-gap); */
            }

            #card-container-result {
                display: grid;
                grid-template-rows: auto;
                grid-template-columns: auto;
                row-gap: var(--container-rows-gap);
            }

            .search-item-cover-image-default {
                display: flex;
                justify-content: flex-end;
                align-items: flex-end;
                color: white;
                height: 100%;
            }

            .search-item-cover-container{
                position: relative;
                background-color: var(--background-basic-color);
            }

            .search-item-cover-image {
                position: absolute;
            }

            .search-item-cover-image, .search-item-cover-container{
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }

            .search-item-cover {
                position: relative;
            }

            .search-item-cover:hover .overlay-play {
                opacity: 1;
            }

            /*
                -----------------
                ----- FORM -----
                -----------------
              */
            #search-form-controls-grid {
                display: grid;
                column-gap: 10px;
                grid-template-columns: 1fr minmax(70px, 160px);
            }

            .search-form-controls-fields-grid {
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: auto auto;
                justify-content: center;
                align-content: center;
                row-gap: 20px;
            }

            .form-button {
                width: 100%;
                margin: 5px;
            }

            /*
            -------------------------------
            ----- FILE MUSIC PLAYLIST -----
            -------------------------------
            */
            .search-filemusicplaylists-grid {
                grid-template-columns: auto;
                grid-template-rows: auto;
            }

            .search-filemusicplaylist-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-auto-rows: auto;
                column-gap: 10px;
            }
            .search-filemusicplaylist-cover {
                grid-column: 1;
                grid-row: 1 / 3;
                width: var(--song-thumbnail-width);
                height: var(--song-thumbnail-width);
            }

            .search-filemusicplaylist-cover-image-default {
                --mdc-icon-size: calc(var(--song-thumbnail-width) - 30px);
            }

            .search-song-filemusicplaylist-image {
                width: var(--song-thumbnail-width);
            }

            .search-filemusicplaylist-label {
                grid-column: 2;
                grid-row: 1;
            }
            .search-filemusicplaylist-file {
                grid-column: 2;
                grid-row: 2;
            }


            /*
            -----------------
            ----- SONGS -----
            -----------------
            */

            .search-songs-grid {
                grid-template-columns: auto;
                grid-template-rows: auto;
            }

            .search-song-grid {
                display: grid;
                grid-template-columns: auto 1fr auto;
                grid-auto-rows: auto;
                column-gap: 10px;
            }

            .search-song-title {
                grid-column: 2 / 4;
                grid-row: 1;
            }

            .search-song-genre {
                grid-column: 2 / 4;
                grid-row: 2;
            }

            .search-song-album {
                grid-column: 2 / 3;
                grid-row: 3;
            }

            .search-song-duration {
                grid-column: 3 / 4;
                grid-row: 3;
            }

            .search-song-cover {
                grid-column: 1;
                grid-row: 1 / 5;
                width: var(--song-thumbnail-width);
                height: var(--song-thumbnail-width);
            }

            .search-song-cover-image-default {
                --mdc-icon-size: calc(var(--song-thumbnail-width) - 30px);
            }


            /*
                ------------------
                ----- ALBUMS -----
                ------------------
                */
            .search-albums-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--album-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-album-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto 1fr;
                row-gap: 3px;
            }


            .search-album-title {
                grid-column: 1 / 3;
                grid-row: 2;
                vertical-align: text-top;
            }

            .search-album-artist {
                grid-column: 1 / 3;
                grid-row: 3 / 4;
                vertical-align: text-top;
            }


            .search-album-cover {
                grid-column: 1 / 2;
                grid-row: 1 ;
                width: var(--album-thumbnail-width);
                height: var(--album-thumbnail-width);
            }

            .search-album-cover-image-default {
                --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
            }

            /*
              -------------------
              ----- ARTISTS -----
              -------------------
              */
            .search-artists-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--artist-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-artist-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto 1fr;
                row-gap: 3px;
            }

            .search-artist-title {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-artist-cover {
                grid-column: 1;
                grid-row: 1 ;
                width: var(--artist-thumbnail-width);
                height: var(--artist-thumbnail-width);
            }

            .search-artist-cover-image-default {
                --mdc-icon-size: calc(var(--artist-thumbnail-width) - 30px);
            }



            /*
            ------------------
            ----- MOVIES -----
            ------------------
          */
            .search-movies-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-movie-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto 1fr;
                row-gap: 3px;
            }


            .search-movie-title {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-movie-genre {
                grid-column: 1 / 3;
                grid-row: 3;
            }

            .search-movie-cover {
                grid-column: 1 / 2;
                grid-row: 1;
                width: var(--movie-thumbnail-width);
                height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
            }

            .search-movie-cover-image-default {
                --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
            }

            /*
            -----------------------
            ----- MUSIC VIDEO -----
            -----------------------
              */
            .search-musicvideos-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--musicvideo-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-musicvideo-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto 1fr;
                row-gap: 3px;
            }

            .search-musicvideo-artist {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-musicvideo-title {
                grid-column: 1 / 3;
                grid-row: 3;
            }

            .search-musicvideo-genre {
                grid-column: 1 / 3;
                grid-row: 4;
            }

            .search-musicvideo-cover {
                grid-column: 1 / 2;
                grid-row: 1;
                width: var(--musicvideo-thumbnail-width);
                height: calc(var(--musicvideo-thumbnail-width) / var(--musicvideo-thumbnail-ratio));
            }

            .search-musicvideo-cover-image-default {
                --mdc-icon-size: calc(var(--musicvideo-thumbnail-width) - 30px);
            }

            /*
                --------------------
                ----- CHANNEL -----
                --------------------
              */
            .search-channels-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-channel-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto 1fr;
                row-gap: 3px;
            }

            .search-channel-title {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-channel-type {
                grid-column: 1 / 3;
                grid-row: 3;
            }

            .search-channels-channeltype {
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                padding-top: 20px;
                text-decoration: underline overline;
            }

            .search-channel-cover {
                grid-column: 1 / 2;
                grid-row: 1;
                width: var(--movie-thumbnail-width);
                height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
            }

            .search-channel-cover-image-default {
                --mdc-icon-size: calc((var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio)) - 30px);
            }



            /*
          --------------------
          ----- EPISODES -----
          --------------------
          */
            .search-episodes-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--episode-thumbnail-width), 1fr));
                grid-template-rows: auto auto auto 1fr;
            }

            .search-episode-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto;
                row-gap: 3px;
            }

            .search-episode-tvshow {
                grid-column: 1 / 3;
                grid-row: 3;
            }

            .search-episode-title {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-episode-genre {
                grid-column: 1 / 3;
                grid-row: 4;
            }

            .search-episode-cover {
                grid-column: 1 / 2;
                grid-row: 1;
                width: var(--episode-thumbnail-width);
                height: calc(var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio));
            }

            .search-episode-cover-image-default {
                --mdc-icon-size: calc((var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio)) - 30px);
            }

            /*
            --------------------
              ----- TV SHOWS -----
              --------------------
            */
            .search-tvshows-grid {
                grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
                grid-template-rows: auto;
            }

            .search-tvshow-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto 1fr;
                row-gap: 3px;
            }

            .search-tvshow-title {
                grid-column: 1 / 3;
                grid-row: 2;
            }

            .search-tvshow-genre {
                grid-column: 1 / 3;
                grid-row: 3;
            }

            .search-tvshow-cover {
                grid-column: 1 / 2;
                grid-row: 1;
                width: var(--movie-thumbnail-width);
                height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
            }

            .search-tvshow-cover-image-default {
                --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
            }

            /*
              ------------------------
              ----- ALBUM DETAIL -----
              ------------------------
              */

            .search-albumsdetails-grid {
                grid-template-columns: 1fr;
                grid-auto-rows: auto;
            }

            .search-albumdetails-grid {
                grid-template-columns: auto 1fr;
                grid-auto-rows: auto;
                border-bottom: solid;
            }

            .search-albumdetails-title {
                width: var(--album-thumbnail-width);
                grid-column: 1;
                grid-row: 2;
                text-align: right;
            }

            .search-albumdetails-duration {
                width: var(--album-thumbnail-width);
                grid-column: 1;
                grid-row: 3;
                font-style: italic;
                text-align: right;
            }

            .search-albumdetails-songs {
                grid-column: 2;
                grid-row: 1 / 5;
            }

            .search-albumdetails-song-grid {
                display: grid;
                grid-template-columns: auto 1fr 25px;
                grid-auto-rows: auto;
                grid-gap: 5px;
                margin-top: 5px;
                margin-bottom: 5px;
                margin-left: 10px;
                margin-right: 10px;
            }

            .search-albumdetails-song-track {
                grid-column: 1;
                grid-row: 1;
            }

            .search-albumdetails-song-title {
                grid-column: 2;
                grid-row: 1;
            }

            .search-albumdetails-song-play {
                grid-column: 3;
                grid-row: 1;
                font-size: 10px;
                text-align: right;
            }

            .search-albumdetails-cover {
                grid-column: 1;
                grid-row: 1;
                width: var(--album-thumbnail-width);
                height: var(--album-thumbnail-width);
            }

            .search-albumdetails-cover-image-default {
                --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
            }

            /*
                  --------------------------------
                  ----- SEASON DETAIL -----
                  --------------------------------
                */
            .search-seasondetails-grid {
                grid-template-columns: auto 1fr;
                grid-auto-rows: auto;
                border-bottom: solid;
            }


            .search-seasondetails-title {
                width: var(--album-thumbnail-width);
                grid-column: 1;
                grid-row: 2;
                text-align: right;
            }

            .search-seasondetails-episodes {
                grid-column: 2;
                grid-row: 1 / 4;
            }

            .search-seasondetails-episode-grid {
                display: grid;
                grid-template-columns: auto 1fr auto 25px;
                grid-auto-rows: auto;
                grid-gap: 5px;
                margin-top: 5px;
                margin-bottom: 5px;
                margin-left: 10px;
                margin-right: 10px;
            }
            .search-seasondetails-episode-track {
                grid-column: 1;
                grid-row: 1;
            }

            .search-seasondetails-episode-title {
                grid-column: 2;
                grid-row: 1;
            }

            .search-seasondetails-episode-play {
                grid-column: 4;
                grid-row: 1;
                font-size: 10px;
                text-align: right;
            }

            .search-seasondetails-cover {
                grid-column: 1;
                grid-row: 1;
                width: var(--album-thumbnail-width);
                height: calc(var(--album-thumbnail-width) / var(--movie-thumbnail-ratio));
            }


            .search-seasondetails-cover-image-default {
                --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
            }
            /* OTHER */
            .song-play,
            .album-play,
            .artist-play,
            .movie-play,
            .tvshow-play,
            .albumdetails-play,
            .seasondetails-play,
            .episode-play,
            .channel-play {
                display: block;
                color: black;
            }

            .song-play:hover,
            .album-play:hover,
            .artist-play:hover,
            .movie-play:hover,
            .tvshow-play:hover,
            .albumdetails-play:hover,
            .albumdetails-song-play:hover,
            .seasondetails-play:hover,
            .seasondetails-episode-play:hover,
            .episode-play:hover,
            channel-play:hover {
                color: red;
            }

        `;
    }

    private _clear() {
        this.hass.callService(this._service_domain, "call_method", {
            entity_id: this.config.entity,
            method: "clear",
        });
        if (this._searchInput) {
            this._searchInput.value = "";
        }
    }

    private _search() {
        let searchText;
        if (this._searchInput) {
            searchText = this._searchInput.value;
            this._searchInput.value = "";
            this.hass.callService(this._service_domain, "call_method", {
                entity_id: this.config.entity,
                method: "search",
                item: {
                    media_type: "all",
                    value: searchText,
                },
            });
        }
    }

    private _recently_added() {
        this.hass.callService(this._service_domain, "call_method", {
            entity_id: this.config.entity,
            method: "search",
            item: {
                media_type: "recently_added",
            },
        });
        if (this._searchInput) {
            this._searchInput.value = "";
        }
    }

    private _recently_played() {
        this.hass.callService(this._service_domain, "call_method", {
            entity_id: this.config.entity,
            method: "search",
            item: {
                media_type: "recently_played",
            },
        });
        if (this._searchInput) {
            this._searchInput.value = "";
        }
    }

    private _addMusicPlaylist(playlist_file){
        this._addItem("filemusicplaylist", playlist_file);
    }

    private _addSong(song_id) {
        this._addItem("songid", song_id);
    }

    private _addAlbum(album_id) {
        this._addItem("albumid", album_id);
    }
    private _addMovie(movie_id) {
        this._addItem("movieid", movie_id);
    }
    private _addMusicVideo(musicvideo_id) {
        this._addItem("musicvideoid", musicvideo_id);
    }
    private _addEpisode(episode_id) {
        this._addItem("episodeid", episode_id);
    }

    private _addEpisodes(episode_ids) {
        this._addItem("episodeid", episode_ids);
    }

    private _addChannel(channel_id) {
        this._addItem("channelid", channel_id);
    }

    private _searchMoreOfArtist(artist_id) {
        this.hass.callService(this._service_domain, "call_method", {
            entity_id: this.config.entity,
            method: "search",
            item: {
                media_type: "artist",
                value: artist_id,
            },
        });
    }

    private _searchMoreOfTvShow(tvshow_id) {
        this.hass.callService(this._service_domain, "call_method", {
            entity_id: this.config.entity,
            method: "search",
            item: {
                media_type: "tvshow",
                value: tvshow_id,
            },
        });
    }

    private _addItem(item_key, item_id) {
        const meth = ACTION_MAP[this._config_action_mode].method;
        const params = {
            entity_id: this.config.entity,
            method: meth,
            position: DEFAULT_ADD_POSITION,
        };
        params[item_key.toString()] = item_id;

        if (meth == "add") {
            params.position = this.config.add_position ? this.config.add_position : 0;
        }

        this.hass.callService(this._service_domain, "call_method", params);
    }
}

