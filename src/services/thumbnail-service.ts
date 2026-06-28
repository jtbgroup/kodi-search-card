import { HomeAssistant } from "custom-card-helpers";

export class ThumbnailService {
    private hass: HomeAssistant;
    private thumbnailCache: Map<string, string> = new Map();
    private thumbnailLoadingSet: Set<string> = new Set();
    private requestUpdateCallback: () => void;

    constructor(hass: HomeAssistant, requestUpdateCallback: () => void) {
        this.hass = hass;
        this.requestUpdateCallback = requestUpdateCallback;
    }

    getItemThumbnailUrl(item: any, category?: string, entityId?: string): string | undefined {
        if (!item) return undefined;

        const cat = (category || "").toLowerCase();
        const mediaPlayerId = entityId || "media_player.kodi";

        // 1. Priorité aux Movies (via 'art' ou 'thumbnail')
        if (cat === "movies" && item.movieid) {
            // Kodi place souvent l'image dans item.art.poster
            const art = item.art?.poster || item.art?.thumb || item.thumbnail;

            // Si c'est une URL directe (http), on la renvoie
            if (typeof art === "string" && art.startsWith("http")) return art;

            // Sinon, on demande à HA de générer l'image via le proxy
            return `/api/media_player_proxy/${mediaPlayerId}/browse_media/movie/${item.movieid}`;
        }

        // 2. Musique : Priorité album
        if (item.albumid) {
            return `/api/media_player_proxy/${mediaPlayerId}/browse_media/album/${item.albumid}`;
        }
        if (item.songid) {
            return `/api/media_player_proxy/${mediaPlayerId}/browse_media/song/${item.songid}`;
        }

        return undefined;
    }

    async loadThumbnail(url: string): Promise<void> {
        // Already cached
        if (this.thumbnailCache.has(url)) {
            return;
        }

        // Already loading
        if (this.thumbnailLoadingSet.has(url)) {
            return;
        }

        this.thumbnailLoadingSet.add(url);

        try {
            const base64 = await this._loadLocalImageAsBase64(url);
            this.thumbnailCache.set(url, base64);
        } catch (error) {
            console.error("Error loading image:", error);
            this.thumbnailCache.set(url, "");
        } finally {
            this.thumbnailLoadingSet.delete(url);
            this.requestUpdateCallback();
        }
    }

    getCachedThumbnail(url: string): string | undefined {
        return this.thumbnailCache.get(url);
    }

    isCached(url: string): boolean {
        return this.thumbnailCache.has(url);
    }

    isLoading(url: string): boolean {
        return this.thumbnailLoadingSet.has(url);
    }

    private async _loadLocalImageAsBase64(url: string): Promise<string> {
        try {
            const response = await this.hass.fetchWithAuth(url);

            if (!response.ok) {
                console.warn(`Image not accessible (${response.status}) for ${url}`);
                return "";
            }

            const blob = await response.blob();
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => {
                    console.warn("Error reading image blob.");
                    resolve("");
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn("Failed to load image via proxy:", error);
            return "";
        }
    }
}

