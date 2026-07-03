import { HomeAssistant } from "custom-card-helpers";
import { CategoryHelper } from "./category-helper";

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
    // 💡 Uniformisé en kodiEntityId (CamelCase) partout
    public kodiEntityId: string | undefined;

    private readonly thumbnailCache: Map<string, string> = new Map();
    private readonly thumbnailLoadingQueue: Map<string, Promise<string>> = new Map();

    constructor(hass: HomeAssistant, kodiEntityId: string | undefined) {
        this.hass = hass;
        this.kodiEntityId = kodiEntityId;
    }

    /**
     * Nettoie les URLs spécifiques de Kodi (ex: image://http%3a%2f%2f...)
     * pour les transformer en URLs web standards (http://...)
     */
    private _cleanKodiUrl(url: any): string | undefined {
        if (typeof url !== "string") return undefined;
        if (url.startsWith("image://http")) {
            return decodeURIComponent(url.replace("image://", ""));
        }
        return url;
    }

    /**
     * Résout l'URL de miniature appropriée selon le type de média
     */
    public getItemThumbnailUrl(
        item: SearchResultItem | null | undefined,
        options: ThumbnailOptions = {},
    ): string | undefined {
        if (!item) return undefined;

        const cat = (options.category || "").toLowerCase();

        // Extraire la source d'image brute potentielle
        const rawArt = item.art?.poster || item.art?.thumb || item.thumbnail;
        // 💡 Correction : On nettoie l'URL immédiatement pour TOUS les cas de figure
        const cleanedArt = this._cleanKodiUrl(rawArt);

        // 1. Priorité aux Movies (via 'art' ou 'poster')
        if (cat === CategoryHelper.CATEGORY_MOVIES && item.movieid) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId est undefined, impossible de générer l'URL proxy pour le film",
                );
                return "";
            }
            return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/movie/${item.movieid}`;
        }

        // Séries & Épisodes
        if (
            (cat === CategoryHelper.CATEGORY_EPISODES && item.episodeid) ||
            (cat === CategoryHelper.CATEGORY_TVSHOWS && item.tvshowid) ||
            (cat === CategoryHelper.CATEGORY_SEASONS && item.seasonid)
        ) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }
        }

        // 2a. Musique : Albums complets
        if (cat === CategoryHelper.CATEGORY_ALBUMS && item.albumid) {
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId est undefined, impossible de générer l'URL proxy pour l'album",
                );
                return "";
            }
            return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/album/${String(item.albumid)}`;
        }

        // 2b. Musique : Chansons / Morceaux individuels (Songs)
        if (cat === CategoryHelper.CATEGORY_SONGS) {
            // Si l'image est déjà une URL internet directe résolue, on l'utilise directement
            if (cleanedArt && cleanedArt.startsWith("http")) {
                return cleanedArt;
            }

            if (!this.kodiEntityId) {
                console.warn(
                    "[ThumbnailService] kodiEntityId est undefined, impossible de générer l'URL proxy pour la chanson",
                );
                return "";
            }

            // Étape clé : Pour une chanson, on utilise le proxy 'track' de HA avec le 'songid'
            // if (item.songid) {
            //     return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/track/${String(item.songid)}`;
            // }

            // Fallback de secours : si Kodi a quand même fourni l'albumid mais pas de songid
            if (item.albumid) {
                return `/api/media_player_proxy/${this.kodiEntityId}/browse_media/album/${String(item.albumid)}`;
            }
        }

        // 3. Fallback global: On retourne l'art nettoyé s'il existe, sinon le thumbnail brut nettoyé
        return cleanedArt || this._cleanKodiUrl(item.thumbnail);
    }

    /**
     * Charge une miniature et la cache
     */
    public async loadThumbnail(url: string): Promise<string | undefined> {
        if (!url || url === "") return "";

        if (this.thumbnailCache.has(url)) {
            return this.thumbnailCache.get(url);
        }

        if (this.thumbnailLoadingQueue.has(url)) {
            console.debug(`[ThumbnailService] URL déjà en cours de chargement, attend: ${url}`);
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
                console.debug(`[ThumbnailService] URL distante (HTTP): ${url}`);
                this.thumbnailCache.set(url, url);
                return url;
            } else if (url.startsWith("/")) {
                console.debug(`[ThumbnailService] URL locale, conversion base64: ${url}`);
                const base64 = await this._loadLocalImageAsBase64(url);
                const result = base64 || "";
                this.thumbnailCache.set(url, result);
                return result;
            } else {
                console.warn(`[ThumbnailService] Format d'URL inconnu ou non nettoyé: ${url}`);
                this.thumbnailCache.set(url, "");
                return "";
            }
        } catch (error) {
            console.error(`[ThumbnailService] Erreur lors du chargement de ${url}:`, error);
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
        console.debug("[ThumbnailService] Cache et queue nettoyés");
    }

    private async _loadLocalImageAsBase64(url: string): Promise<string | undefined> {
        try {
            const response = await this.hass.fetchWithAuth(url);
            if (!response.ok) {
                console.warn(`[ThumbnailService] Image non accessible (HTTP ${response.status}) pour ${url}`);
                return undefined;
            }
            const blob = await response.blob();
            return await this._blobToBase64(blob);
        } catch (error) {
            console.warn("[ThumbnailService] Échec du chargement via proxy:", error);
            return undefined;
        }
    }

    private _blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => {
                console.warn("[ThumbnailService] Erreur lors de la lecture du blob");
                reject(new Error("Failed to read blob"));
            };
            reader.readAsDataURL(blob);
        });
    }
}

export {};
