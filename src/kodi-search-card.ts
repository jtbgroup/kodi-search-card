import "./editor";
import "./components/search-controls";
import "./components/results-container";
import { LitElement, html, css, PropertyValues, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { KodiSearchCardConfig, SearchResults, SearchResultItem, ItemClickDetail, SearchActionType } from "./types";
import { SearchService } from "./services/search-service";
import { ThumbnailService } from "./services/thumbnail-service";
import { convertOutlineColor, getMusicPlaylistItemKind } from "./utils/formatters";
import {
    DEFAULT_ACTION_MODE,
    DEFAULT_ADD_POSITION,
    DEFAULT_ALBUM_DETAILS_SORT,
    DEFAULT_MEDIA_TYPE_ORDER,
    DEFAULT_OUTLINE_COLOR,
    DEFAULT_SHOW_ACTION_MODE,
    DEFAULT_SHOW_RECENTLY_ADDED,
    DEFAULT_SHOW_RECENTLY_PLAYED,
    DEFAULT_SHOW_MUSIC_PLAYLIST,
    DEFAULT_SHOW_THUMBNAIL,
    DEFAULT_SHOW_THUMBNAIL_BORDER,
    DEFAULT_SHOW_THUMBNAIL_OVERLAY,
    ALBUM_SORT,
    DEFAULT_SHOW_VERSION,
    CARD_VERSION,
    CATEGORY_MUSICPLAYLISTS,
    PLAYLISTID_AUDIO,
    ACTION_MAP,
    ADD_POSITION,
    DEFAULT_SHOW_CURRENT_ARTIST,
} from "./const";
import { kodiSearchCardCSS } from "./styles/kodi-search-card.style";

@customElement("kodi-search-card")
export class KodiSearchCard extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: KodiSearchCardConfig;
    @state() private _results: SearchResults | null = null;
    @state() private _query = "";
    @property({ type: String }) _searchAction: SearchActionType = ACTION_MAP.play.id;

    @state() private _resolvedEntryId?: string;
    @state() private _resolvedKodiEntityId?: string;

    @state() private _sensorState = "unavailable";
    @state() private _isArtistView = false;
    @state() private _artistName = "";

    @state() private _isTvShowView = false;
    @state() private _tvShowName = "";

    private _searchService?: SearchService;
    private _thumbnailService?: ThumbnailService;

    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement("kodi-search-card-editor") as LovelaceCardEditor;
    }

    static getStubConfig(): Record<string, unknown> {
        return {
            title: "Kodi Search",
            show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
            show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
            show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
            outline_color: DEFAULT_OUTLINE_COLOR,
            album_details_sort: DEFAULT_ALBUM_DETAILS_SORT,
            show_action_mode: DEFAULT_SHOW_ACTION_MODE,
            show_recently_added: DEFAULT_SHOW_RECENTLY_ADDED,
            show_recently_played: DEFAULT_SHOW_RECENTLY_PLAYED,
            show_music_playlist: DEFAULT_SHOW_MUSIC_PLAYLIST,
            show_current_artist: DEFAULT_SHOW_CURRENT_ARTIST, 
            action_mode: DEFAULT_ACTION_MODE,
            add_position: DEFAULT_ADD_POSITION,
            order: DEFAULT_MEDIA_TYPE_ORDER,
            show_version: DEFAULT_SHOW_VERSION,
        };
    }

    static get styles(): CSSResultGroup {
        return [kodiSearchCardCSS];
    }
    public setConfig(config: KodiSearchCardConfig): void {
        if (!config || !config.entity) {
            throw new Error("The Kodi configuration entity is required");
        }
        this._config = config;
    }

    protected willUpdate(changedProperties: PropertyValues) {
        super.willUpdate(changedProperties);

        if (changedProperties.has("hass") || changedProperties.has("_config")) {
            this._resolveConfig();
            this._fetchSensorState();
            this._initializeServices();
        }
    }
    private _initializeServices(): void {
        if (this._resolvedEntryId && this.hass) {
            if (!this._searchService) {
                this._searchService = new SearchService(this.hass, this._resolvedEntryId);
            }

            if (!this._thumbnailService) {
                this._thumbnailService = new ThumbnailService(this.hass, this._resolvedKodiEntityId);
            }
        }
    }

    private _fetchSensorState(): void {
        if (!this.hass || !this._config?.entity) {
            this._sensorState = "unavailable";
            return;
        }

        const sensorEntity = this.hass.states[this._config.entity];
        this._sensorState = sensorEntity ? sensorEntity.state : "unavailable";
    }

    private _resolveConfig(): void {
        if (!this.hass || !this._config?.entity) return;

        const state = this.hass.states[this._config.entity];
        if (state && state.attributes.config_entry_id) {
            this._resolvedEntryId = state.attributes.config_entry_id;
            this._resolvedKodiEntityId = state.attributes.kodi_entity_id;
        } else {
            console.error("The selected entity does not have the required attributes.");
        }
        this._searchAction = this._config?.action_mode ?? ACTION_MAP.play.id;
    }

    private _getCurrentArtistInfo(): { id?: number | string } {
        if (!this.hass || !this._config?.entity) return {};
        const stateObj = this.hass.states[this._config.entity];
        if (!stateObj || !stateObj.attributes) return {};

        const id = stateObj.attributes.current_track?.artist_id || stateObj.attributes.artist_id;
        return { id };
    }

    private async _performSearch(): Promise<void> {
        this._isArtistView = false;
        this._isTvShowView = false;

        if (!this._searchService || !this._query.trim()) {
            this._results = null;
            return;
        }

        try {
            this._results = await this._searchService.search(this._query);
        } catch (error) {
            console.error("Search error:", error);
            this._results = {};
        }
    }

    private async _handleNavigation(type: string): Promise<void> {
        this._isArtistView = false;
        this._isTvShowView = false;

        if (!this._searchService) return;

        try {
            if (type === "recently_played") {
                this._results = await this._searchService.searchRecentlyPlayed();
            } else if (type === "recently_added") {
                this._results = await this._searchService.searchRecentlyAdded();
            } else if (type === "current_artist") {
                this._query = "";
                const artistInfo = this._getCurrentArtistInfo();

                this._drillDownArtist(artistInfo.id);
            } else if (type === "music_playlists") {
                this._results = await this._searchService.searchMusicPlaylists();
            }
        } catch (e) {
            console.error(`Navigation error [${type}]:`, e);
        }
    }

    private _clearAll(): void {
        this._query = "";
        this._results = null;
        this._isArtistView = false;
        this._artistName = "";
        this._isTvShowView = false;
        this._tvShowName = "";
    }

    // This method coordinates the actions to perform. Each submethod must manage the card behavior, such as the boolean this._isArtistView.
    private _handleSearchControls(e: CustomEvent): void {
        const type = e.type;

        if (type === "search") {
            this._performSearch();
        } else if (type === "clear") {
            this._clearAll();
        } else if (type === "navigate") {
            this._handleNavigation(e.detail);
        }
    }

    private _handleResultsClick = async (e: CustomEvent<ItemClickDetail>): Promise<void> => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        const { item, category } = e.detail;
        if (!item) {
            console.error("The event does not contain any data in e.detail", e);
            return;
        }

        if (category === "artists" && item.artistid) {
            await this._drillDownArtist(item.artistid);
            return;
        }

        if (category === "tvshows" && item.tvshowid) {
            await this._drillDownTvShow(item);
            return;
        }

        // ===== GESTION DES PLAYLISTS MUSICALES =====
        if (category === CATEGORY_MUSICPLAYLISTS) {
            const playlistKind = getMusicPlaylistItemKind(item);
            if (playlistKind === "directory") {
                await this._drillDownMusicPlaylist(item);
                return;
            }

            if (playlistKind === "blocked") {
                return;
            }

            // If the item is a file, we handle the playlist
            if (item.file) {
                if (!this._resolvedEntryId) {
                    console.error("Authentication data (entry_id) is missing.");
                    return;
                }
                try {
                    if (this._searchAction === ACTION_MAP.play.id) {
                        await this.hass.connection.sendMessagePromise({
                            type: "kodi_media_sensors/playlist_play",
                            entry_id: this._resolvedEntryId,
                            path: String(item.file),
                            playlistid: PLAYLISTID_AUDIO,
                        });
                    } else if (this._searchAction === ACTION_MAP.add.id) {
                        await this.hass.connection.sendMessagePromise({
                            type: "kodi_media_sensors/playlist_add",
                            entry_id: this._resolvedEntryId,
                            path: String(item.file),
                            playlistid: PLAYLISTID_AUDIO,
                            position: this._config?.add_position ?? ADD_POSITION.last.id,
                        });
                    }
                    return;
                } catch (err) {
                    console.error("WebSocket error playing dedicated playlist:", err);
                }
            }
        }

        // ===== PLAY/ADD LOGIC POUR TOUS LES AUTRES ELEMENTS (Chansons, Albums, Films...) =====
        let id: string | number | undefined;
        let itemName: string | undefined;

        if (item.type) {
            itemName = item.type === "file" ? "file" : `${item.type}id`;
            const targetKey = item.type === "file" ? "file" : itemName;
            const value = item[targetKey as keyof SearchResultItem];

            if (value && typeof value !== "object") {
                id = value as string | number;
            }
        }

        if (id === undefined || !itemName) {
            if (item.songid !== undefined) {
                id = item.songid;
                itemName = "songid";
            } else if (item.albumid !== undefined) {
                id = item.albumid;
                itemName = "albumid";
            } else if (item.movieid !== undefined) {
                id = item.movieid;
                itemName = "movieid";
            } else if (item.musicvideoid !== undefined) {
                id = item.musicvideoid;
                itemName = "musicvideoid";
            } else if (item.episodeid !== undefined) {
                id = item.episodeid;
                itemName = "episodeid";
            } else if (item.channelid !== undefined) {
                id = item.channelid;
                itemName = "channelid";
            }
        }

        if (id === undefined || !itemName) {
            console.error("Unable to determine the item identifier or type", item);
            return;
        }

        if (itemName !== "file") {
            const parsed = parseInt(String(id), 10);
            if (isNaN(parsed)) {
                console.error(`Unable to execute the action: item_id (${id}) is not a valid integer.`);
                return;
            }
            id = parsed;
        } else {
            id = String(id);
        }

        if (!this._resolvedEntryId) {
            console.error("Authentication data (entry_id) is missing. The integration is not ready.");
            return;
        }

        const isAddAction = this._searchAction === "add";
        const wsType = isAddAction ? "kodi_media_sensors/playlist_add_item" : "kodi_media_sensors/playlist_play_item";

        const servicePayload: { type: string } & Record<string, any> = {
            type: wsType,
            entry_id: this._resolvedEntryId,
            item_id: id,
            item_name: itemName,
        };

        if (isAddAction) {
            servicePayload.position = this._config?.add_position || ADD_POSITION.last.id;
        }

        try {
            await this.hass.connection.sendMessagePromise(servicePayload);
        } catch (err) {
            console.error(`WebSocket error returned by Home Assistant for [${wsType}]:`, err);
        }
    };


    private async _drillDownTvShow(item: any): Promise<void> {
        if (!this._searchService || !item.tvshowid) return;

        try {
            // Assume that the searchService has a method to retrieve a TV show's seasons.
            this._results = await this._searchService.searchTvShow(item.tvshowid);
            this._isTvShowView = true;
            this._tvShowName = item.title || item.label || "TV show";
        } catch (e) {
            this._isTvShowView = false;
            console.error("Error drilling down TV show:", e);
        }
    }

    private async _drillDownArtist(artistId?: number | string): Promise<void> {
        if (!this._searchService || !artistId) return;

        try {
            this._results = await this._searchService.searchCurrentArtist(artistId);
            this._isArtistView = true;

            const albums = this._results.albums || [];
            if (albums.length > 0 && albums[0].artist) {
                this._artistName = Array.isArray(albums[0].artist) ? albums[0].artist[0] : albums[0].artist;
            } else {
                this._artistName = "Artist unknown";
            }
        } catch (e) {
            this._isArtistView = false;
            console.error("Error drilling down artist:", e);
        }
    }

    private async _drillDownMusicPlaylist(item: SearchResultItem): Promise<void> {
        if (!this._searchService || !item.file) return;

        try {
            this._results = await this._searchService.searchMusicPlaylists(item.file);
            this._isArtistView = false;
            this._isTvShowView = false;
        } catch (e) {
            console.error("Error drilling down music playlist directory:", e);
        }
    }

    private _reorderResult() {
        const order: string[] = this._config?.media_type_order ?? DEFAULT_MEDIA_TYPE_ORDER;
        if (this._results) {
            const orderedResult: Partial<SearchResults> = {};

            for (const key of order) {
                const pluralKey = `${key}s` as keyof SearchResults;

                if (this._results[pluralKey] !== undefined) {
                    orderedResult[pluralKey] = this._results[pluralKey];
                }
            }
            this._results = orderedResult as SearchResults;
        }
    }

    private _sortAlbums() {
        const sortMethod = this._config?.album_details_sort ?? DEFAULT_ALBUM_DETAILS_SORT;
        if (!this._results) return;

        const rawAlbums = this._results.albums || (this._results as any).results?.albums;

        if (!Array.isArray(rawAlbums)) {
            return;
        }

        const albumsCopy = [...rawAlbums] as SearchResultItem[];

        switch (sortMethod) {
            case ALBUM_SORT.title_asc.id:
                albumsCopy.sort((a, b) =>
                    String(a.title ?? a.label ?? "").localeCompare(String(b.title ?? b.label ?? "")),
                );
                break;

            case ALBUM_SORT.title_desc.id:
                albumsCopy.sort((a, b) =>
                    String(b.title ?? b.label ?? "").localeCompare(String(a.title ?? a.label ?? "")),
                );
                break;

            case ALBUM_SORT.date_desc.id:
                albumsCopy.sort((a, b) => parseFloat(String(b.year ?? 0)) - parseFloat(String(a.year ?? 0)));
                break;

            case ALBUM_SORT.date_asc.id:
                albumsCopy.sort((a, b) => parseFloat(String(a.year ?? 0)) - parseFloat(String(b.year ?? 0)));
                break;

            default:
                return;
        }

        if (this._results.albums) {
            this._results = {
                ...this._results,
                albums: albumsCopy,
            };
        } else if ((this._results as any).results?.albums) {
            this._results = {
                ...(this._results as any),
                results: {
                    ...(this._results as any).results,
                    albums: albumsCopy,
                },
            };
        }
    }

    protected render() {
        let statusClass = "fixed-green";
        const showVersion = this._config?.show_version ?? false;

        if (this._sensorState === "off") {
            statusClass = "fixed-red";
        } else if (this._sensorState === "playing") {
            statusClass = "flashing-green";
        } else if (["paused", "stopped"].includes(this._sensorState)) {
            statusClass = "fixed-green";
        } else if (this._sensorState === "idle") {
            statusClass = "fixed-orange";
        }

        if (this._isArtistView) {
            this._sortAlbums();
        }

        if (!this._isArtistView && !this._isTvShowView) {
            this._reorderResult();
        }

        return html`
            <div class="card-header">
                <h3 class="card-title">
                    <ha-icon class="kodi-icon" icon="mdi:kodi"></ha-icon>
                    ${this._config?.title || "Kodi Search"}
                </h3>
                <div class="status-dot ${statusClass}"></div>
            </div>

            <kodi-search-controls
                .query="${this._query}"
                .searchAction="${this._searchAction}"
                .showActionMode="${this._config?.show_action_mode ?? true}"
                .showRecentlyAdded="${this._config?.show_recently_added ?? true}"
                .showRecentlyPlayed="${this._config?.show_recently_played ?? true}"
                .showCurrentArtist="${this._config?.show_current_artist ?? true}"
                .showMusicPlaylists="${this._config?.show_music_playlist ?? true}"
                @search="${this._handleSearchControls}"
                @clear="${this._handleSearchControls}"
                @navigate="${this._handleSearchControls}"
                @query-changed="${(e: any) => (this._query = e.detail)}"
                @action-changed="${(e: any) => (this._searchAction = e.detail)}">
            </kodi-search-controls>

            <div class="search-content">
                ${this._results
                    ? html`
                          <kodi-results-container
                              .results="${this._results}"
                              .showThumbnail="${this._config?.show_thumbnail ?? true}"
                              .showThumbnailOverlay="${this._config?.show_thumbnail_overlay ?? true}"
                              .showThumbnailBorder="${this._config?.show_thumbnail_border ?? true}"
                              .outlineColor="${convertOutlineColor(
                                  this._config?.outline_color ?? "var(--divider-color)",
                              )}"
                              .albumDetailsSort="${this._config?.album_details_sort ?? "default"}"
                              .searchAction="${this._searchAction}"
                              .thumbnailService="${this._thumbnailService}"
                              .isArtistView="${this._isArtistView}"
                              .artistName="${this._artistName}"
                              .isTvShowView="${this._isTvShowView}"
                              .tvShowName="${this._tvShowName}"
                              @item-click="${this._handleResultsClick}">
                          </kodi-results-container>
                      `
                    : html``}
            </div>
            ${showVersion ? html` <div class="version-footer">Version: ${CARD_VERSION}</div> ` : ""}
        `;
    }
}

