import "./editor";
import "./components/search-controls";
import "./components/results-container";
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { KodiSearchCardConfig } from "./types";
import { SearchResults } from "./types";
import { SearchService } from "./services/search-service";
import { ThumbnailService } from "./services/thumbnail-service";

@customElement("kodi-search-card")
export class KodiSearchCard extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: KodiSearchCardConfig;
    @state() private _results: SearchResults | null = null;
    @state() private _query = "";
    @state() private _searchAction: "play" | "add" = "play";

    @state() private _resolvedEntryId?: string;
    @state() private _resolvedKodiEntityId?: string;

    @state() private _sensorState = "unavailable";
    @state() private _isArtistView = false;
    @state() private _artistName = "";

    private _searchService?: SearchService;
    private _thumbnailService?: ThumbnailService;

    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement("kodi-search-card-editor");
    }

    static getStubConfig(): Record<string, string> {
        return {
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

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
            }

            .card-title {
                margin: 0;
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .kodi-icon {
                color: var(--accent-color);
            }

            @keyframes pulse-dot {
                0%,
                100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.3;
                }
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                transition: background 0.3s ease;
            }

            .status-dot.fixed-green {
                background: var(--success-color);
            }

            .status-dot.fixed-orange {
                background: var(--warning-color);
            }

            .status-dot.fixed-red {
                background: var(--error-color);
            }

            .status-dot.flashing-green {
                background: var(--success-color);
                animation: pulse-dot 1s infinite;
            }

            .search-content {
                background-color: #141414;
            }
        `;
    }

    public setConfig(config: KodiSearchCardConfig): void {
        if (!config || !config.entity) {
            throw new Error("L'entité de configuration Kodi est requise");
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
        if (this._resolvedEntryId && this._resolvedKodiEntityId && this.hass) {
            if (!this._searchService) {
                this._searchService = new SearchService(this.hass, this._resolvedEntryId, this._resolvedKodiEntityId);
            }

            if (!this._thumbnailService) {
                this._thumbnailService = new ThumbnailService(this.hass, () => this.requestUpdate());
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
            console.error("L'entité sélectionnée n'a pas les attributs requis.");
        }
    }

    private _getCurrentArtistInfo(): { id?: number | string } {
        if (!this.hass || !this._config?.entity) return {};
        const stateObj = this.hass.states[this._config.entity];
        if (!stateObj || !stateObj.attributes) return {};

        const id = stateObj.attributes.current_track?.artist_id || stateObj.attributes.artist_id;
        return { id };
    }

    private async _performSearch(): Promise<void> {
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
        if (!this._searchService) return;

        try {
            if (type === "recently_played") {
                this._results = await this._searchService.searchRecentlyPlayed();
            } else if (type === "recently_added") {
                this._results = await this._searchService.searchRecentlyAdded();
            } else if (type === "current_artist") {
                this._query = "";
                const artistInfo = this._getCurrentArtistInfo();

                if (!artistInfo.id) {
                    console.warn("No artist currently playing");
                    return;
                }

                this._results = await this._searchService.searchCurrentArtist(artistInfo.id);
                this._isArtistView = true;

                const albums = this._results.albums || [];
                if (albums.length > 0 && albums[0].artist) {
                    this._artistName = Array.isArray(albums[0].artist) ? albums[0].artist[0] : albums[0].artist;
                }
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
    }

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

private async _handleResultsClick(e: CustomEvent): Promise<void> {
    const item = e.detail;

    // ==========================================
    // 1. INTERCEPTION ET FORCE DU DRILLDOWN (Artistes & Séries TV)
    // ==========================================
    
    // Si c'est un artiste (on détecte 'artistid'), on appelle votre méthode existante !
    if (item.artistid !== undefined) {
        this._query = ""; // Nettoyer le champ de recherche textuel
        await this._drillDownArtist(item); // Appel de votre méthode native
        return; // ARRÊT IMMÉDIAT : On ne passe pas au Play/Add
    }

    // Si c'est une série TV (on détecte 'tvshowid')
    if (item.tvshowid !== undefined) {
        this._query = ""; 
        if (this._searchService) {
            try {
                // Si searchCurrentArtist existe, vérifiez si searchTVShow ou similaire existe.
                // Si votre service n'a pas de méthode spécifique, on tente d'adapter avec les méthodes disponibles :
                if (typeof (this._searchService as any).searchTVShow === "function") {
                    this._results = await (this._searchService as any).searchTVShow(item.tvshowid);
                } else {
                    // En l'absence de méthode spécifique connue, on repasse l'identifiant à la recherche principale
                    this._results = await this._searchService.search(String(item.tvshowid));
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des détails de la série TV :", err);
            }
        }
        return; // ARRÊT IMMÉDIAT
    }

    // ==========================================
    // 2. CAS DU JEU / AJOUT DE MÉDIA FINAUX (Play & Add)
    // ==========================================
    
    let itemName: string | undefined;
    let itemId: number | string | undefined;

    // Détermination de la clé attendue par le backend python pour les éléments lisibles
    if (item.songid !== undefined) { itemName = "songid"; itemId = item.songid; }
    else if (item.albumid !== undefined) { itemName = "albumid"; itemId = item.albumid; }
    else if (item.movieid !== undefined) { itemName = "movieid"; itemId = item.movieid; }
    else if (item.musicvideoid !== undefined) { itemName = "musicvideoid"; itemId = item.musicvideoid; }
    else if (item.episodeid !== undefined) { itemName = "episodeid"; itemId = item.episodeid; }
    else if (item.channelid !== undefined) { itemName = "channelid"; itemId = item.channelid; }
    else if (item.file !== undefined) { itemName = "filemusicplaylist"; itemId = item.file; }

    // Validation pour les éléments finaux (fichiers/chansons/etc.)
    if (!itemName || itemId === undefined) {
        console.error("Impossible de déterminer le type ou l'ID de l'élément Kodi", item);
        return;
    }

    // Convertir l'ID en entier pour les IDs numériques standard de Kodi
    const formattedId = typeof itemId === "string" && itemName !== "filemusicplaylist" 
        ? parseInt(itemId, 10) || itemId 
        : itemId;

    // Détermination de la route WebSocket exacte déclarée dans le backend playlist.py
    const wsType = this._searchAction === "add"
        ? "kodi_media_sensors/playlist_add_item"  
        : "kodi_media_sensors/playlist_play_item";

    const servicePayload = {
        type: wsType,
        entry_id: this._resolvedEntryId,
        item_id: formattedId,
        item_name: itemName,
        kodi_entity_id: this._resolvedKodiEntityId || this._config?.entity
    };

    if (!servicePayload.entry_id || !servicePayload.kodi_entity_id) {
        console.error("Données d'authentification ou entité Kodi manquantes pour le WebSocket", servicePayload);
        return;
    }

    try {
        await this.hass.connection.sendMessagePromise(servicePayload);
        console.log(`Action ${this._searchAction} exécutée avec succès :`, servicePayload);
    } catch (err) {
        console.error(`Erreur lors de l'envoi de la commande ${this._searchAction} via WebSocket :`, err);
    }
}

    private async _drillDownArtist(item: any): Promise<void> {
        if (!this._searchService || !item.artistid) return;

        try {
            this._results = await this._searchService.searchCurrentArtist(item.artistid);
            this._isArtistView = true;

            const albums = this._results.albums || [];
            if (albums.length > 0 && albums[0].artist) {
                this._artistName = Array.isArray(albums[0].artist) ? albums[0].artist[0] : albums[0].artist;
            } else {
                this._artistName = item.title || item.label || "Artist";
            }
        } catch (e) {
            console.error("Error drilling down artist:", e);
        }
    }

    protected render() {
        let statusClass = "fixed-green";

        if (this._sensorState === "off") {
            statusClass = "fixed-red";
        } else if (this._sensorState === "playing") {
            statusClass = "flashing-green";
        } else if (["paused", "stopped"].includes(this._sensorState)) {
            statusClass = "fixed-green";
        } else if (this._sensorState === "idle") {
            statusClass = "fixed-orange";
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
                              .searchAction="${this._searchAction}"
                              .thumbnailService="${this._thumbnailService}"
                              .isArtistView="${this._isArtistView}"
                              .artistName="${this._artistName}"
                              @item-click="${this._handleResultsClick}"></kodi-results-container>
                      `
                    : ""}
            </div>
        `;
    }
}

