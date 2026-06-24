import { HomeAssistant } from "custom-card-helpers";
import { SearchResultItem } from "../types";

export class ThumbnailService {
    private thumbnailCache: Map<string, string> = new Map();
    private thumbnailLoadingSet: Set<string> = new Set();
    private requestUpdateCallback: () => void;

    constructor(hass: HomeAssistant, requestUpdateCallback: () => void) {
        this.hass = hass;
        this.requestUpdateCallback = requestUpdateCallback;
    }

    private hass: HomeAssistant;

    getItemThumbnailUrl(item: any, category?: string, entityId?: string): string | undefined {
        if (!item) return undefined;

        const cat = (category || "").toLowerCase();
        const mediaPlayerId = entityId || "media_player.kodi";

        // Music: Albums / Songs via HA Proxy
        if (cat === "albums" || cat === "songs" || item.albumid || item.songid) {
            if (item.albumid) {
                return `/api/media_player_proxy/${mediaPlayerId}/browse_media/album/${item.albumid}`;
            }
            if (item.songid) {
                return `/api/media_player_proxy/${mediaPlayerId}/browse_media/song/${item.songid}`;
            }
        }

        // Video & others: direct attributes
        const directUrl = item.poster || item.thumbnail || item.fanart;
        if (typeof directUrl === "string" && directUrl.startsWith("http")) {
            return directUrl;
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
