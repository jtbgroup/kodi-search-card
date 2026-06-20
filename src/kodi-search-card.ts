import "./editor";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { KodiSearchCardConfig } from "./types";

// Type pour les résultats de recherche

interface SearchResultItem {
    title?: string;
    name?: string;
    label?: string;
    artist?: string | string[];
    album?: string;
    thumbnail?: string;
    year?: number | string;
    rating?: number;
    duration?: number;
    genre?: string | string[];
    file?: string;
}

interface SearchResults {
    movies?: SearchResultItem[];
    tvshows?: SearchResultItem[];
    songs?: SearchResultItem[];
    albums?: SearchResultItem[];
    artists?: SearchResultItem[];
    [key: string]: SearchResultItem[] | undefined;
}
interface WebSocketRequest {
type: string;
    entry_id: string;
    kodi_entity_id: string; 
    query?: string; 
    category?: string;
}

interface WebSocketResponse {
    results?: SearchResults;
    entity_id?: string; // 🚀 Ajouté pour le support agnostique de l'entity_id
    [key: string]: unknown;
}

@customElement("kodi-search-card")
export class KodiSearchCard extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: KodiSearchCardConfig;
    @state() private _results: SearchResults | null = null;
    @state() private _query = "";
    @state() private _entityId = ""; // 🚀 Stocke l'entity_id retourné par le backend
    @state() private _searchAction: "play" | "add" = "play";

    @state() private _resolvedEntryId?: string;
    @state() private _resolvedKodiEntityId?: string;

    @state() private _thumbnailCache: Map<string, string> = new Map();
    private _thumbnailLoadingSet: Set<string> = new Set();


    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement("kodi-search-card-editor");
    }

    static getStubConfig(): Record<string, string> {
        return {
            entry_id: "",
            title: "Kodi Search",
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                background: var(--ha-card-background, var(--card-background-color, #ffffff));
                border-radius: var(--ha-card-border-radius, 12px);
                border: 1px solid var(--divider-color);
                overflow: hidden;
            }

            /* Container des contrôles d'entrée natifs */
            .search-container {
                display: flex;
                gap: 8px;
                padding: 16px;
                background-color: #1c1c1c;
            }
            .search-container input[type="text"] {
                flex: 1;
                background: #2a2a2a;
                border: 1px solid #3d3d3d;
                color: #fff;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
            }
            .search-container button {
                background: #3d3d3d;
                color: #fff;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            .search-container button:hover {
                background: #4d4d4d;
            }

            /* Wrapper des résultats globaux */
            .results-wrapper {
                background-color: #141414;
                padding: 0 16px 16px 16px;
            }
            .category-section {
                margin-bottom: 24px;
            }
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #333;
                padding-bottom: 6px;
                margin: 16px 0 12px 0;
                color: #ffffff;
                font-size: 0.95rem;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .category-header ha-icon {
                --mdc-icon-size: 18px;
                opacity: 0.7;
                color: var(--accent-color, #03a9f4);
            }

            /* --- STYLES RENDU EN MODE LISTE (Songs, Movies...) --- */
            .results-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .list-item {
                display: flex;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #252525;
            }
            .list-item:last-child {
                border-bottom: none;
            }

            .item-info {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow: hidden;
            }
            .item-title {
                color: #ffffff;
                font-weight: 500;
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .item-subtext {
                color: #8a8a8a;
                font-size: 0.8rem;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .item-duration {
                color: #8a8a8a;
                font-size: 0.8rem;
                font-family: monospace;
                margin-left: 12px;
                flex-shrink: 0;
            }

            /* --- STYLES RENDU EN MODE GRILLE (Albums, Artists...) --- */
            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 16px;
                padding-top: 4px;
            }
            .grid-card {
                display: flex;
                flex-direction: column;
            }

            .grid-title {
                color: #ffffff;
                font-size: 0.85rem;
                font-weight: 500;
                line-height: 1.2;
                max-height: 2.4em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .grid-meta {
                color: #8a8a8a;
                font-size: 0.75rem;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .no-results-msg {
                color: #8a8a8a;
                text-align: center;
                padding: 32px;
                font-size: 0.95rem;
                background-color: #141414;
            }

            .search-controls {
                display: flex;
                flex-direction: column; /* Empile les éléments */
                gap: 8px;
                padding: 12px 16px;
                background: var(--secondary-background-color);
            }
            .search-input-wrapper {
                display: flex;
                flex-grow: 1;
                background: var(--card-background-color);
                border-radius: 8px;
                border: 1px solid var(--divider-color);
                align-items: center; /* Aligne l'icône et l'input */
            }
            input {
                flex-grow: 1;
                padding: 10px 12px;
                border: none;
                background: transparent;
                outline: none;
                color: var(--primary-text-color);
            }
            .clear-icon {
                cursor: pointer;
                padding: 8px;
                color: var(--error-color); /* Rouge pour bien le voir */
                display: flex;
                align-items: center;
            }
            select {
                padding: 10px;
                border-radius: 8px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                color: var(--primary-text-color);
                width: 100%; /* Prend toute la largeur dispo */
                cursor: pointer;
            }

            .grid-card,
            .list-item {
                cursor: pointer;
            }
            .grid-card:hover,
            .list-item:hover {
                opacity: 0.8;
                background: var(--secondary-background-color);
            }
            ,
            .list-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px;
            }

            .thumb-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(180, 180, 180, 0.5);
                color: white;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .grid-thumb-wrapper .thumb-overlay {
                --mdc-icon-size: 70px;
            }

            .list-thumb-wrapper .thumb-overlay {
                --mdc-icon-size: 30px;
            }

            .thumb-overlay ha-icon {
                width: var(--mdc-icon-size);
                height: var(--mdc-icon-size);
            }

            .thumb-overlay ha-icon[icon="mdi:menu"] {
                position: absolute;
                top: 8px;
            }

            .grid-thumb-wrapper,
            .list-thumb-wrapper {
                position: relative;
                cursor: pointer;
                overflow: hidden;
                border-radius: 8px;
                display: flex; /* Force le centrage */
                align-items: center;
                justify-content: center;
                background: var(--secondary-background-color);
            }

            .grid-thumb-wrapper {
                width: 100%;
                aspect-ratio: 1/1;
            }
            .list-thumb-wrapper {
                width: 60px;
                height: 60px;
                flex-shrink: 0;
            }

            .grid-thumb,
            .list-thumb,
            .thumb-placeholder {
                width: 100%;
                height: 100%;
                object-fit: cover; /* Assure que l'image remplit tout */
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .thumb-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .grid-thumb-wrapper:hover .thumb-overlay,
            .list-thumb-wrapper:hover .thumb-overlay {
                opacity: 1;
            }

            /* Fond gris pour les conteneurs */
            .thumb-placeholder.is-container {
                background-color: var(--secondary-background-color);
                opacity: 0.8;
                position: relative; /* Pour que l'icône enfant puisse être absolute */
            }

            /* Positionnement de l'icône dans le placeholder conteneur */
            .thumb-placeholder.is-container ha-icon {
                position: absolute;
                bottom: 8px;
                right: 8px;
                font-size: 1.2em;
            }

            /* Cas normal (Play/Plus) : on centre l'icône */
            .thumb-placeholder:not(.is-container) {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
    }

    public setConfig(config: KodiSearchCardConfig): void {
        if (!config || !config.entity) {
            throw new Error("L'entité de configuration Kodi est requise");
        }
        this._config = config;
    }

protected updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    
    // 1. Résolution de la config quand hass change
    if (changedProperties.has("hass")) {
        this._resolveConfig();
    }

    // 2. SÉCURITÉ : Ne jamais lancer de recherche automatique 
    // tant que les IDs ne sont pas résolus.
    if (changedProperties.has("_resolvedKodiEntityId") && this._resolvedKodiEntityId) {
        // Tu peux déclencher un chargement initial ici si tu veux
        // this._performSearch(); 
    }
}

  private _resolveConfig(): void {
    if (!this.hass || !this._config?.entity) return;

    const state = this.hass.states[this._config.entity];
    
    if (state && state.attributes.config_entry_id) {
        // On stocke dans des variables locales, PAS dans this._config
        this._resolvedEntryId = state.attributes.config_entry_id;
        this._resolvedKodiEntityId = state.attributes.kodi_entity_id;
        
        console.log("Configuration résolue :", { 
            entry: this._resolvedEntryId, 
            kodi: this._resolvedKodiEntityId 
        });
    } else {
        console.error("L'entité sélectionnée n'a pas les attributs requis.");
    }
}

private async _performSearch(): Promise<void> {
        // 1. Validation de la config résolue
        if (!this._resolvedEntryId || !this._resolvedKodiEntityId || !this._query.trim()) {
            this._results = null;
            return;
        }

        try {
            console.info("Sending query:", this._query, "to entry:", this._resolvedEntryId);

            const request: WebSocketRequest = {
                type: "kodi_media_sensors/search",
                // Utilisation des propriétés dynamiques résolues via l'entité coquille
                entry_id: this._resolvedEntryId,
                kodi_entity_id: this._resolvedKodiEntityId,
                query: this._query,
                category: "all",
            };

            // Appel WebSocket
            const response = (await this.hass.callWS(request)) as WebSocketResponse;

            // 2. Mise à jour des résultats
            this._results = response?.results ?? {};

            // 3. Mise à jour de l'entity_id si le backend le renvoie (sécurité)
            if (response?.entity_id) {
                this._resolvedKodiEntityId = response.entity_id;
            }
        } catch (error) {
            console.error("Search error:", error);
            // Note: assure-toi que ton interface SearchResults accepte bien une clé 'error' 
            // sinon, utilise un gestionnaire d'erreur séparé.
            this._results = {}; 
        }
    }

    private _handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this._performSearch();
        }
    }

    private _handleInputChange(e: Event): void {
        const target = e.target as HTMLInputElement;
        this._query = target.value;
    }

    protected render() {
        return html`
            <div class="card-header">
                <h3>${this._config?.title || "Kodi Search"}</h3>
            </div>

            ${this._renderControls()}

            <div class="search-content">${this._results ? this._renderResultsContainer(this._results) : ""}</div>
        `;
    }

    private _renderControls() {
        return html`
            <div class="search-controls">
                <div class="search-input-wrapper">
                    <input
                        .value="${this._query}"
                        @input="${(e: any) => (this._query = e.target.value)}"
                        @keydown="${(e: any) => e.key === "Enter" && this._performSearch()}"
                        placeholder="Rechercher..." />
                    ${this._query
                        ? html`<ha-icon
                              class="clear-icon"
                              icon="mdi:close"
                              @click="${() => {
                                  this._query = "";
                                  this._results = null;
                              }}"></ha-icon>`
                        : ""}
                </div>

                <select .value="${this._searchAction}" @change="${(e: any) => (this._searchAction = e.target.value)}">
                    <option value="play">▶ Jouer immédiatement</option>
                    <option value="add">➕ Ajouter à la suite</option>
                </select>
            </div>
        `;
    }

    private _renderResultsContainer(results: SearchResults) {
        const hasResults =
            Object.keys(results).length > 0 &&
            Object.values(results).some(items => Array.isArray(items) && items.length > 0);

        if (!hasResults) {
            return html`<div class="no-results-msg">No results</div>`;
        }

        return html`
            <div class="results-wrapper">
                ${Object.entries(results).map(([category, items]) => {
                    if (Array.isArray(items) && items.length > 0) {
                        return this._renderSection(category, items);
                    }
                    return "";
                })}
            </div>
        `;
    }

    private _renderSection(category: string, items: SearchResultItem[]) {
        const isGridLayout = ["albums", "artists"].includes(category.toLowerCase());
        const sectionIcon = this._getCategoryIcon(category);

        return html`
            <div class="category-section">
                <h3 class="category-header">
                    <span>${category.toUpperCase()}</span>
                    <ha-icon icon="${sectionIcon}"></ha-icon>
                </h3>

                ${isGridLayout
                    ? html` <div class="results-grid">${items.map(item => this._renderGridItem(item, category))}</div> `
                    : html`
                          <ul class="results-list">
                              ${items.map(item => this._renderListItem(item, category))}
                          </ul>
                      `}
            </div>
        `;
    }

    private _renderListItem(item: SearchResultItem, category: string) {
        const title = item.title || item.label || item.name || "Unknown";
        const artist = Array.isArray(item.artist) ? item.artist.join(", ") : item.artist;
        const icon = this._getCategoryIcon(category);
        const resolvedThumbnail = this._getItemThumbnailUrl(item, category);

        return html`
            <div class="list-item">
                <div class="list-thumb-wrapper" @click="${() => this._handleItemAction(item, category)}">
                    ${this._renderItemThumbnail(resolvedThumbnail, icon, "grid-thumb", category)}

                    <div class="thumb-overlay">
                        <ha-icon icon="${this._getActionIcon(category)}"></ha-icon>
                    </div>
                </div>

                <div class="list-info">
                    <div class="list-title">${title}</div>
                    <div class="list-meta">${artist || ""}</div>
                </div>
            </div>
        `;
    }

    private _renderItemThumbnail(resolvedUrl: string | undefined, icon: string, cssClass: string, category: string) {
        // On définit si c'est un conteneur pour appliquer le style "gris léger"
        const isContainer = ["tvshows", "artists"].includes(category.toLowerCase());
        const containerClass = isContainer ? "is-container" : "";
        const fullCssClass = `${cssClass} ${containerClass}`;

        if (!resolvedUrl) {
            return html`<div class="${fullCssClass} thumb-placeholder"><ha-icon icon="${icon}"></ha-icon></div>`;
        }

        // 1. Cache
        if (this._thumbnailCache.has(resolvedUrl)) {
            const data = this._thumbnailCache.get(resolvedUrl);
            return data
                ? html`<img class="${cssClass}" src="${data}" />` // Note: pas besoin de containerClass ici car c'est une image
                : html`<div class="${fullCssClass} thumb-placeholder"><ha-icon icon="${icon}"></ha-icon></div>`;
        }

        // 2. Loading
        if (this._thumbnailLoadingSet.has(resolvedUrl)) {
            return html`<div class="${fullCssClass} thumb-placeholder"><ha-icon icon="${icon}"></ha-icon></div>`;
        }

        // 3. Premier passage
        this._thumbnailLoadingSet.add(resolvedUrl);
        this._getThumbnailURL(resolvedUrl);

        return html`<div class="${fullCssClass} thumb-placeholder"><ha-icon icon="${icon}"></ha-icon></div>`;
    }

    private async _getThumbnailURL(url: string): Promise<void> {
        try {
            // On utilise ta méthode authentifiée
            const base64 = await this._loadLocalImageAsBase64(url);
            this._thumbnailCache.set(url, base64);
        } catch (error) {
            console.error("Erreur chargement image authentifiée :", error);
            this._thumbnailCache.set(url, ""); // Marquer comme "pas d'image" pour ne pas boucler
        } finally {
            this._thumbnailLoadingSet.delete(url);
            // On demande à Lit d'afficher les images maintenant qu'elles sont en cache
            this.requestUpdate();
        }
    }

    private async _loadLocalImageAsBase64(url: string): Promise<string> {
        try {
            const response = await this.hass.fetchWithAuth(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Erreur dans _loadLocalImageAsBase64:", error);
            throw error;
        }
    }
    // 🚀 Signature corrigée : Accepte l'argument 'category' optionnel pour une robustesse maximale
    // private _getItemThumbnailUrl(item: any, category?: string): string | undefined {
    //     if (!item) return undefined;

    //     // Détection intelligente du type (via l'item ou via la catégorie parente)
    //     let itemType = item.type;
    //     if (!itemType && category) {
    //         const catLower = category.toLowerCase();
    //         if (catLower === "songs") itemType = "song";
    //         else if (catLower === "albums") itemType = "album";
    //         else if (catLower === "artists") itemType = "artist";
    //         else if (catLower === "movies") itemType = "movie";
    //         else if (catLower === "tvshows") itemType = "tvshow";
    //     }

    //     // Utilisation de l'entityId dynamique récupéré du WebSocket (avec repli de sécurité)
    //     const entityId = this._entityId || "media_player.kodi";

    //     // 🎵 Pour les chansons et albums (Format query params officiel de HA)
    //     if (itemType === "song" || itemType === "music" || itemType === "album") {
    //         const albumId = item.albumid;
    //         if (albumId) {
    //             const url = `/api/media_player_proxy//browse_media/album/${albumId}`;
    //             console.log(url);
    //             return url;
    //         }
    //     }

    //     // 🎬 Pour les Films
    //     if (itemType === "movie") {
    //         const movieId = item.movieid;
    //         if (movieId) {
    //             return `/api/media_player_proxy/${entityId}?media_content_type=movie&media_content_id=${movieId}`;
    //         }
    //     }

    //     // 📺 Pour les Séries TV
    //     if (itemType === "tvshow") {
    //         const tvshowId = item.tvshowid;
    //         if (tvshowId) {
    //             return `/api/media_player_proxy/${entityId}?media_content_type=tvshow&media_content_id=${tvshowId}`;
    //         }
    //     }

    //     // 🎞️ Pour les Épisodes de série
    //     if (itemType === "episode") {
    //         const episodeId = item.episodeid;
    //         if (episodeId) {
    //             return `/api/media_player_proxy/${entityId}?media_content_type=episode&media_content_id=${episodeId}`;
    //         }
    //     }

    //     // Fallback d'origine pour les vidéos ou fichiers génériques
    //     if (itemType === "video") {
    //         const poster = item.poster;
    //         if (poster && poster !== "") {
    //             return poster;
    //         }
    //     }

    //     return item.thumbnail;
    // }

    private _getItemThumbnailUrl(item: any, category?: string): string | undefined {
        if (!item) return undefined;

        // Force la catégorie en minuscules
        const cat = (category || "").toLowerCase();
        const entityId = this._entityId || "media_player.kodi";

        // CAS 1 : Musique (Albums / Chansons) via Proxy HA
        if (cat === "albums" || cat === "songs" || item.albumid || item.songid) {
            if (item.albumid) return `/api/media_player_proxy/${entityId}/browse_media/album/${item.albumid}`;
            if (item.songid) return `/api/media_player_proxy/${entityId}/browse_media/song/${item.songid}`;
        }

        // CAS 2 : Vidéos et autres (via attributs directs)
        // On vérifie item.poster, item.thumbnail (si c'est une URL), ou item.fanart
        const directUrl = item.poster || item.thumbnail || item.fanart;
        if (typeof directUrl === "string" && directUrl.startsWith("http")) {
            return directUrl;
        }

        return undefined; // Si rien n'est trouvé, le bloc placeholder prendra le relais
    }

    // Utilitaires de formatage de chaînes
    private _getCategoryIcon(category: string): string {
        switch (category.toLowerCase()) {
            case "songs":
                return "mdi:music";
            case "albums":
                return "mdi:album";
            case "artists":
                return "mdi:account-music";
            case "movies":
                return "mdi:movie-open";
            case "tvshows":
                return "mdi:television-classic";
            default:
                return "mdi:play-circle";
        }
    }

    private _getMetaLine(item: SearchResultItem, category: string): string {
        const parts: string[] = [];

        if (item.artist) {
            parts.push(Array.isArray(item.artist) ? item.artist.join(", ") : item.artist);
        }
        if (item.album) {
            parts.push(item.album);
        }
        if (item.year) {
            parts.push(`(${item.year})`);
        }

        return parts.length > 0 ? parts.join(" • ") : category;
    }

    private _formatDuration(seconds: number | undefined): string {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    private _renderGridItem(item: SearchResultItem, category: string) {
        const icon = this._getCategoryIcon(category);
        const resolvedThumbnail = this._getItemThumbnailUrl(item, category);

        return html`
            <div class="grid-card">
                <div class="grid-thumb-wrapper" @click="${() => this._handleItemAction(item, category)}">
                    ${this._renderItemThumbnail(resolvedThumbnail, icon, "grid-thumb", category)}

                    <div class="thumb-overlay">
                        <ha-icon icon="${this._getActionIcon(category)}"></ha-icon>
                    </div>
                </div>

                <div class="grid-title">${item.title || item.label}</div>
            </div>
        `;
    }

    private _handleItemAction(item: SearchResultItem, category: string) {
        const isNavigation = ["tvshows", "artists"].includes(category.toLowerCase());

        if (isNavigation) {
            console.log(`Action: NAVIGATION | Item:`, item.title || item.label);
            // Ici, tu pourras plus tard déclencher une recherche filtrée sur ce nom
            this._query = item.title || item.label || "";
        } else {
            const action = this._searchAction;
            console.log(`Action: ${action.toUpperCase()} | Item:`, item.title || item.label);
            // Ici, tu appelleras tes services Kodi
        }
    }

    private _getActionIcon(category: string): string {
        const categoriesToNavigate = ["tvshows", "artists"];

        // Si c'est une catégorie "navigation", on renvoie toujours la loupe
        if (categoriesToNavigate.includes(category.toLowerCase())) {
            return "mdi:menu";
        }

        // Sinon, on renvoie l'icône basée sur l'action choisie
        return this._searchAction === "play" ? "mdi:play" : "mdi:plus";
    }

    const elementName = "kodi-search-card-editor";
if (!customElements.get(elementName)) {
    customElements.define(elementName, KodiSearchCardEditor);
}
}

