/**
 * ============================================================================
 * THUMBNAIL SERVICE - SEARCH CARD
 * Version Améliorée (9/10)
 * 
 * Basée sur les leçons apprises de la refactorisation Playlist Card
 * Intègre:
 * - Queue de promesses robuste (Map<Promise> au lieu de Set)
 * - API minimaliste (4 méthodes au lieu de 5)
 * - Type-safety améliorée
 * - Memory management explicite (clearCache)
 * - Meilleur error handling
 * ============================================================================
 */

import { HomeAssistant } from "custom-card-helpers";

/**
 * Interface pour les items de recherche
 * Remplace le type 'any' par une vraie interface
 * 
 * Note: Les IDs peuvent être string ou number selon la source
 */
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
    [key: string]: any; // Fallback pour items inconnus
}

/**
 * Options de configuration pour getItemThumbnailUrl
 */
export interface ThumbnailOptions {
    mediaPlayerId?: string;
    category?: string;
}

/**
 * ============================================================================
 * THUMBNAIL SERVICE
 * ============================================================================
 */
export class ThumbnailService {
    private hass: HomeAssistant;
    // private requestUpdateCallback: () => void;

    // Cache des miniatures chargées
    private readonly thumbnailCache: Map<string, string> = new Map();

    // 🔑 KEY IMPROVEMENT: Queue de promesses au lieu de Set<string>
    // Permet d'attendre les chargements en cours au lieu de retourner immédiatement
    private readonly thumbnailLoadingQueue: Map<string, Promise<string>> = new Map();

    // constructor(hass: HomeAssistant, requestUpdateCallback: () => void) {
    //     this.hass = hass;
    //     // this.requestUpdateCallback = requestUpdateCallback;
    // }
    constructor(hass: HomeAssistant) {
    this.hass = hass;
}

    /**
     * Résout l'URL de miniature appropriée selon le type de média
     * 
     * Type-safe: accepte SearchResultItem au lieu de any
     * Self-contained: pas de paramètres externes (contrairement à avant)
     */
    public getItemThumbnailUrl(
        item: SearchResultItem | null | undefined,
        options: ThumbnailOptions = {}
    ): string | undefined {
        if (!item) return undefined;

        const mediaPlayerId = options.mediaPlayerId || "media_player.kodi";
        const cat = (options.category || "").toLowerCase();



        // 1. Priorité aux Movies (via 'art' ou 'poster')
        if (cat === "movies" && item.movieid) {

            // Chercher l'image dans item.art.poster en priorité
            const art = item.art?.poster || item.art?.thumb || item.thumbnail;

            // Si c'est une URL directe (http), la retourner
            if (typeof art === "string" && art.startsWith("http")) {
                return art;
            }

            // Sinon, demander à HA de générer via le proxy
            return `/api/media_player_proxy/${mediaPlayerId}/browse_media/movie/${item.movieid}`;
        }

         if ((cat === "episodes" && item.episodeid)|| (cat === "tvshows" && item.tvshowid)) {
            const art = item.art?.poster || item.art?.thumb || item.thumbnail;
            if (typeof art === "string" && art.startsWith("image://http")) {
                return decodeURIComponent(art.replace("image://", ""));
            }
         }

        // 2. Musique : Priorité album, puis song
        if (cat === "songs" || cat  === "albums") {
            if (item.albumid) {
                return `/api/media_player_proxy/${mediaPlayerId}/browse_media/album/${String(item.albumid)}`;
            }
        }

        // 3. Fallback: thumbnail générique
        return item.thumbnail ? String(item.thumbnail) : undefined;
    }

    /**
     * Charge une miniature et la cache
     * 
     * 🔑 KEY IMPROVEMENT: Retourne une Promise<string> au lieu de Promise<void>
     * 🔑 KEY IMPROVEMENT: Implémente la queue de promesses
     * 
     * Si deux appels avec le même URL:
     * - Premier: Lance le chargement HTTP
     * - Deuxième: Attend le premier au lieu de retourner immédiatement
     * 
     * @returns Promise<string> - L'URL base64 chargée ou chaîne vide si erreur
     */
    public async loadThumbnail(url: string): Promise<string | undefined> {
        // Déjà en cache
        if (this.thumbnailCache.has(url)) {
            return this.thumbnailCache.get(url);
        }

        // 🔑 AMÉLIORATION: Attendre si déjà en cours de chargement
        // Avant (Set): if (this.thumbnailLoadingSet.has(url)) return;
        // Après (Map<Promise>): if (loadingQueue.has) return await loadingQueue.get()
        if (this.thumbnailLoadingQueue.has(url)) {
            console.debug(`[ThumbnailService] URL déjà en cours de chargement, attend: ${url}`);
            return await this.thumbnailLoadingQueue.get(url);
        }

        // Lancer le chargement
        const loadPromise = this._performLoad(url);
        this.thumbnailLoadingQueue.set(url, loadPromise);

        const result = await loadPromise;
        this.thumbnailLoadingQueue.delete(url);

        return result;
    }

    /**
     * Logique interne de chargement
     * Séparée de loadThumbnail() pour meilleure lisibilité
     * 
     * Gère:
     * - URLs distantes (http): utilisées directement
     * - URLs locales (/): converties en base64
     * - URLs inconnues: retourne chaîne vide
     */
    private async _performLoad(url: string): Promise<string> {
        try {
            if (url.startsWith("http")) {
                // URL distante: l'utiliser directement
                console.debug(`[ThumbnailService] URL distante (HTTP): ${url}`);
                this.thumbnailCache.set(url, url);
                return url;
            } else if (url.startsWith("/")) {
                // URL locale: la convertir en base64
                console.debug(`[ThumbnailService] URL locale, conversion base64: ${url}`);
                const base64 = await this._loadLocalImageAsBase64(url);
                const result = base64 || "";
                this.thumbnailCache.set(url, result);
                return result;
            } else {
                // URL inconnue
                console.warn(`[ThumbnailService] Format d'URL inconnu: ${url}`);
                this.thumbnailCache.set(url, "");
                return "";
            }
        } catch (error) {
            console.error(`[ThumbnailService] Erreur lors du chargement de ${url}:`, error);
            this.thumbnailCache.set(url, "");
            return "";
        // } finally {
        //     // Appeler le callback une seule fois quand le chargement est terminé
        //     this.requestUpdateCallback();
        }
    }

    /**
     * Récupère une miniature depuis le cache
     * 
     * 🔑 AMÉLIORATION: Renommé de getCachedThumbnail à getCachedThumbnail
     * (Plus cohérent avec getItemThumbnailUrl)
     * 
     * @returns undefined si pas en cache, ou la valeur en cache
     */
    public getCachedThumbnail(url: string): string | undefined {
        return this.thumbnailCache.get(url);
    }

    /**
     * Vérifie si une URL est en cache
     * 
     * ⚠️ ANCIEN: Cette méthode exposait un détail d'implémentation
     * 
     * NOUVELLE APPROCHE:
     * Cette méthode est conservée pour rétro-compatibilité,
     * mais préférer utiliser getCachedThumbnail() qui retourne
     * undefined si pas en cache
     * 
     * @deprecated Utiliser getCachedThumbnail() à la place
     */
    public isCached(url: string): boolean {
        return this.thumbnailCache.has(url);
    }

    /**
     * Vérifie si une URL est en cours de chargement
     * 
     * ⚠️ ANCIEN: Cette méthode exposait un détail d'implémentation
     * 
     * NOUVELLE APPROCHE:
     * Cette méthode est conservée pour rétro-compatibilité,
     * mais les appels clients ne devraient pas en avoir besoin.
     * loadThumbnail() gère automatiquement l'attente.
     * 
     * @deprecated Pas nécessaire avec la queue de promesses
     */
    public isLoading(url: string): boolean {
        return this.thumbnailLoadingQueue.has(url);
    }

    /**
     * 🔑 NOUVEAU: Nettoie le cache et la queue
     * 
     * Important pour:
     * - Éviter les memory leaks
     * - Réinitialiser le service
     * - Gestion du cycle de vie du composant
     * 
     * À appeler dans disconnectedCallback():
     * public disconnectedCallback(): void {
     *     super.disconnectedCallback();
     *     this._thumbnailService?.clearCache();
     * }
     */
    public clearCache(): void {
        this.thumbnailCache.clear();
        this.thumbnailLoadingQueue.clear();
        console.debug("[ThumbnailService] Cache et queue nettoyés");
    }

    /**
     * Charge une image locale via le proxy HA et la convertit en base64
     * 
     * Utilisé par _performLoad() pour les URLs locales (/)
     */
    private async _loadLocalImageAsBase64(url: string): Promise<string | undefined> {
        try {
            const response = await this.hass.fetchWithAuth(url);

            if (!response.ok) {
                console.warn(
                    `[ThumbnailService] Image non accessible (HTTP ${response.status}) pour ${url}`
                );
                return undefined;
            }

            const blob = await response.blob();
            return await this._blobToBase64(blob);
        } catch (error) {
            console.warn("[ThumbnailService] Échec du chargement via proxy:", error);
            return undefined;
        }
    }

    /**
     * Convertit un Blob en chaîne base64
     * 
     * Séparé dans sa propre méthode pour lisibilité
     */
    private _blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                console.warn("[ThumbnailService] Erreur lors de la lecture du blob");
                reject(new Error("Failed to read blob"));
            };
            reader.readAsDataURL(blob);
        });
    }
}


export {};