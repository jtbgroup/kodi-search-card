// ─── Artists ────────────────────────────────────────────────────────────────
import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../../styles/shared.styles";
import {
    artistsStyles,
    moviesStyles,
    musicvideosStyles,
    tvshowsStyles,
    episodesStyles,
    channelsStyles,
    filemusicplaylistStyles,
} from "../../styles/media.styles";
import "../kodi-cover-element";

// ─── Helper to decode Kodi image:// URLs ────────────────────────────────────
function decodeKodiImageUrl(raw: string): string {
    let url = decodeURIComponent(decodeURI(raw));
    const marker = "image://";
    const idx = url.indexOf(marker);
    if (idx >= 0) {
        url = url.substring(idx + marker.length);
        if (url.endsWith("/")) url = url.slice(0, -1);
    }
    return url;
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-artists
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-artists")
export class KodiMediaArtists extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-artists-grid search-grid search-item-container-grid">
                ${this.items.map(
                    item => html`
                        <div class="search-artist-grid">
                            <kodi-cover-element
                                class="search-artist-cover"
                                coverClass="search-artist-cover"
                                defaultIconClass="search-artist-cover-image-default"
                                defaultIcon="mdi:microphone"
                                overlayIcon="mdi:menu"
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-browse-artist", {
                                        artistId: item.artistid,
                                    })}></kodi-cover-element>
                            <div class="search-artist-title search-title">${item.artist}</div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, artistsStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-movies
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-movies")
export class KodiMediaMovies extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-movies-grid search-grid search-item-container-grid">
                ${this.items.map(item => {
                    const imageUrl = item.poster || item.thumbnail || "";
                    return html`
                        <div class="search-movie-grid">
                            <kodi-cover-element
                                class="search-movie-cover"
                                coverClass="search-movie-cover"
                                defaultIconClass="search-movie-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon=${this.actionIcon}
                                imageUrl=${imageUrl}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-movie", { movieId: item.movieid })}></kodi-cover-element>
                            <div class="search-movie-title search-title">${item.title}</div>
                            <div class="search-movie-genre search-genre">${item.genre} (${item.year})</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, moviesStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-musicvideos
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-musicvideos")
export class KodiMediaMusicVideos extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-musicvideos-grid search-grid search-item-container-grid">
                ${this.items.map(item => {
                    const raw = item.poster || item.thumbnail || "";
                    const imageUrl = decodeKodiImageUrl(raw);
                    return html`
                        <div class="search-musicvideo-grid">
                            <kodi-cover-element
                                class="search-musicvideo-cover"
                                coverClass="search-musicvideo-cover"
                                defaultIconClass="search-musicvideo-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon=${this.actionIcon}
                                imageUrl=${imageUrl}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-musicvideo", {
                                        musicVideoId: item.musicvideoid,
                                    })}></kodi-cover-element>
                            <div class="search-musicvideo-artist search-title">${item.artist}</div>
                            <div class="search-musicvideo-title">${item.title} (${item.year})</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, musicvideosStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-tvshows
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-tvshows")
export class KodiMediaTvShows extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-tvshows-grid search-grid search-item-container-grid">
                ${this.items.map(item => {
                    const imageUrl = item.poster || item.thumbnail || "";
                    return html`
                        <div class="search-tvshow-grid">
                            <kodi-cover-element
                                class="search-tvshow-cover"
                                coverClass="search-tvshow-cover"
                                defaultIconClass="search-tvshow-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon="mdi:menu"
                                imageUrl=${imageUrl}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-browse-tvshow", {
                                        tvShowId: item.tvshowid,
                                    })}></kodi-cover-element>
                            <div class="search-tvshow-title search-title">${item.title}</div>
                            <div class="search-tvshow-genre search-genre">${item.genre} (${item.year})</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, tvshowsStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-episodes
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-episodes")
export class KodiMediaEpisodes extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-episodes-grid search-grid search-item-container-grid">
                ${this.items.map(item => {
                    const raw = item.poster || item.thumbnail || "";
                    const imageUrl = decodeKodiImageUrl(raw);
                    return html`
                        <div class="search-episode-grid">
                            <kodi-cover-element
                                class="search-episode-cover"
                                coverClass="search-episode-cover"
                                defaultIconClass="search-episode-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon=${this.actionIcon}
                                imageUrl=${imageUrl}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-episode", {
                                        episodeId: item.episodeid,
                                    })}></kodi-cover-element>
                            <div class="search-episode-title search-title">${item.title}</div>
                            <div class="search-episode-tvshow search-tvshow">
                                ${item.tvshowtitle}
                                (S${item.season.toString().padStart(2, "0")}:E${item.episode
                                    .toString()
                                    .padStart(2, "0")})
                            </div>
                            <div class="search-episode-genre search-genre">${item.genre}</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, episodesStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-channels
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-channels")
export class KodiMediaChannels extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    private _renderGroup(channels: any[], type: "tv" | "radio"): TemplateResult {
        return html`
            <div class="search-channels-channeltype">${type === "tv" ? "TV Channels" : "Radio Channels"}</div>
            <div class="search-channels-grid search-grid search-item-container-grid">
                ${channels.map(
                    item => html`
                        <div class="search-channel-grid">
                            <kodi-cover-element
                                class="search-channel-cover"
                                coverClass="search-channel-cover"
                                defaultIconClass="search-channel-cover-image-default"
                                defaultIcon="mdi:movie"
                                overlayIcon=${this.actionIcon}
                                imageUrl=${item.poster || item.thumbnail || ""}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-channel", {
                                        channelId: item.channelid,
                                    })}></kodi-cover-element>
                            <div class="search-channel-title search-title">${item.label}</div>
                            <div class="search-channel-type search-genre">
                                ${item.channeltype} (nr ${item.channelnumber})
                            </div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    protected render(): TemplateResult {
        const tv = this.items.filter(i => i.channeltype === "tv");
        const radio = this.items.filter(i => i.channeltype === "radio");
        return html`
            ${tv.length > 0 ? this._renderGroup(tv, "tv") : ""}
            ${radio.length > 0 ? this._renderGroup(radio, "radio") : ""}
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, channelsStyles];
    }
}

// ════════════════════════════════════════════════════════════════════════════
// kodi-media-filemusicplaylist
// ════════════════════════════════════════════════════════════════════════════
@customElement("kodi-media-filemusicplaylist")
export class KodiMediaFileMusicPlaylist extends LitElement {
    @property({ attribute: false }) items: any[] = [];
    @property() actionIcon = "mdi:play";
    @property({ type: Boolean }) showThumbnailOverlay = true;
    @property({ type: Boolean }) showThumbnailBorder = false;

    private _emit(name: string, detail: Record<string, unknown>): void {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    protected render(): TemplateResult {
        return html`
            <div class="search-filemusicplaylists-grid search-grid search-item-container-grid">
                ${this.items.map(
                    item => html`
                        <div class="search-filemusicplaylist-grid">
                            <kodi-cover-element
                                class="search-filemusicplaylist-cover"
                                coverClass="search-filemusicplaylist-cover"
                                defaultIconClass="search-filemusicplaylist-cover-image-default"
                                defaultIcon="mdi:disc"
                                overlayIcon=${this.actionIcon}
                                ?showOverlay=${this.showThumbnailOverlay}
                                ?showBorder=${this.showThumbnailBorder}
                                @kodi-cover-action=${() =>
                                    this._emit("kodi-play-playlist", {
                                        file: item.file,
                                    })}></kodi-cover-element>
                            <div class="search-filemusicplaylist-label search-title">${item.label}</div>
                            <div class="search-filemusicplaylist-title">${item.file}</div>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return [sharedStyles, filemusicplaylistStyles];
    }
}
