import { HomeAssistant } from "custom-card-helpers";
import { CATEGORY_ALBUMS, CATEGORY_CHANNELS, CATEGORY_EPISODES, CATEGORY_MOVIES, CATEGORY_MUSICVIDEOS, CATEGORY_SEASONS, CATEGORY_SONGS, CATEGORY_TVSHOWS } from "../const";

export interface SearchResultItem {
    movieid?: string | number;
    songid?: string | number;
    albumid?: string | number;
    episodeid?: string | number;
    file?: string;
    poster?: string;
    thumbnail?: string;
    art?: {
        poster?: string;
        thumb?: string;
    };
    title?: string;
    label?: string;
    type?: string;
    tvshowid?: string | number;
    artistid?: string | number;
    [key: string]: any;
}

export interface ThumbnailOptions {
    mediaPlayerId?: string;
    category?: string;
}

export class ThumbnailService {
    private hass: HomeAssistant;
    public kodiEntityId: string | undefined;

    private readonly thumbnailCache: Map<string, string> = new Map();
    private readonly thumbnailLoadingQueue: Map<string, Promise<string>> = new Map();

    constructor(hass: HomeAssistant, kodiEntityId: string | undefined) {
        this.hass = hass;
        this.kodiEntityId = kodiEntityId;
    }

    private _cleanKodiUrl(url: any): string | undefined {
        if (typeof url !== "string") return undefined;
        let result = url;
        if (result.startsWith("image://http")) {
            result = decodeURIComponent(result.replace("image://", ""));
        }
        if(result.endsWith("/")){
            result = result.substring(0, result.length-1);
        }
        return result;
    }

    /**
     * Resolves the appropriate thumbnail URL based on the media type.
     */
    public getItemThumbnailUrl(
        item: SearchResultItem | null | undefined,
        options: ThumbnailOptions = {},
    ): string | undefined {
        if (!item) return undefined;

        const cat = (options.category || "").toLowerCase();

        // Extract the potential raw image source.
        const rawArt = item.art?.poster || item.art?.thumb || item.thumbnail;
        const cleanedArt = this._cleanKodiUrl(rawArt);

        // Movies
        if (cat === CATEGORY_MOVIES && item.movieid) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId is undefined, cannot generate the proxy URL for the movie",
                );
                return "";
            }
            return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/movie/${item.movieid}`;
        }

        // TV Shows, Seasons & Épisodes || Music Videos
        if (
            (cat === CATEGORY_EPISODES && item.episodeid) ||
            (cat === CATEGORY_TVSHOWS && item.tvshowid) ||
            (cat === CATEGORY_SEASONS && item.seasonid) || (cat === CATEGORY_MUSICVIDEOS && item.musicvideoid)
        ) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }
        }

        // CHANNELS
        if (cat === CATEGORY_CHANNELS) {
           if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }
        }

        // ALBUMS
        if (cat === CATEGORY_ALBUMS && item.albumid) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId is undefined, cannot generate the proxy URL for the album",
                );
                return "";
            }
            return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/album/${String(item.albumid)}`;
        }

        // SONGS
        if (cat === CATEGORY_SONGS) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId is undefined, cannot generate the proxy URL for the song",
                );
                return "";
            }

            if (item.albumid) {
                return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/album/${String(item.albumid)}`;
            }
        }

        return cleanedArt || this._cleanKodiUrl(item.thumbnail);
    }

    /**
     * Loads a thumbnail and caches it.
     */
    public async loadThumbnail(url: string): Promise<string | undefined> {
        if (!url || url === "") return "";

        if (this.thumbnailCache.has(url)) {
            return this.thumbnailCache.get(url);
        }

        if (this.thumbnailLoadingQueue.has(url)) {
            return await this.thumbnailLoadingQueue.get(url);
        }

        const loadPromise = this._performLoad(url);
        this.thumbnailLoadingQueue.set(url, loadPromise);

        const result = await loadPromise;
        this.thumbnailLoadingQueue.delete(url);

        return result;
    }

    private async _performLoad(url: string): Promise<string> {
        try {
            if (url.startsWith("http")) {
                this.thumbnailCache.set(url, url);
                return url;
            } else if (url.startsWith("/")) {
                const base64 = await this._loadLocalImageAsBase64(url);
                const result = base64 || "";
                this.thumbnailCache.set(url, result);
                return result;
            } else {
                console.warn(`[ThumbnailService] Unknown or uncleaned URL format: ${url}`);
                this.thumbnailCache.set(url, "");
                return "";
            }
        } catch (error) {
            console.error(`[ThumbnailService] Error loading ${url}:`, error);
            this.thumbnailCache.set(url, "");
            return "";
        }
    }

    public getCachedThumbnail(url: string): string | undefined {
        return this.thumbnailCache.get(url);
    }

    /** @deprecated */
    public isCached(url: string): boolean {
        return this.thumbnailCache.has(url);
    }

    /** @deprecated */
    public isLoading(url: string): boolean {
        return this.thumbnailLoadingQueue.has(url);
    }

    public clearCache(): void {
        this.thumbnailCache.clear();
        this.thumbnailLoadingQueue.clear();
    }

    private async _loadLocalImageAsBase64(url: string): Promise<string | undefined> {
        try {
            const response = await this.hass.fetchWithAuth(url);
            if (!response.ok) {
                console.warn(`[ThumbnailService] Image not accessible (HTTP ${response.status}) for ${url}`);
                return undefined;
            }
            const blob = await response.blob();
            return await this._blobToBase64(blob);
        } catch (error) {
            console.warn("[ThumbnailService] Failed to load via proxy:", error);
            return undefined;
        }
    }

    private _blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => {
                console.warn("[ThumbnailService] Error reading the blob");
                reject(new Error("Failed to read blob"));
            };
            reader.readAsDataURL(blob);
        });
    }
}

export {};
