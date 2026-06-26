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
    // @state() private _resolvedKodiEntityId?: string;

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
        if (this._resolvedEntryId && this.hass) {
            if (!this._searchService) {
                this._searchService = new SearchService(this.hass, this._resolvedEntryId);
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

async _handleResultsClick(e: any): Promise<void> {
        const item = e.detail;

        if (!item) {
            console.error("L'événement ne contient aucune donnée dans e.detail", e);
            return;
        }

        let id: string | number | undefined;
        let itemName: string | undefined;

        // 1. Détermination ultra-simple si Kodi fournit le 'type' (ex: "song", "album")
        if (item.type) {
            itemName = item.type === "file" ? "filemusicplaylist" : `${item.type}id`;
            
            // Récupération dynamique de la valeur (ex: item["songid"] ou item["file"])
            const targetKey = item.type === "file" ? "file" : itemName;
            id = item[targetKey];
        } 
        
        // 2. Sécurité (Fallback) : Si la propriété 'type' n'est pas présente dans l'objet
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
            } else if (item.episodeid !== undefined) {
                id = item.episodeid;
                itemName = "episodeid";
            } else if (item.channelid !== undefined) {
                id = item.channelid;
                itemName = "channelid";
            } else if (item.file !== undefined) {
                id = item.file;
                itemName = "filemusicplaylist";
            }
        }

        // 3. Conversion stricte en entier sauf pour le chemin du fichier
        if (itemName !== "filemusicplaylist" && id !== undefined) {
            const parsed = parseInt(String(id), 10);
            if (isNaN(parsed)) {
                console.error(`Impossible d'exécuter l'action : item_id (${id}) n'est pas un entier valide.`);
                return;
            }
            id = parsed;
        }

        // Si aucun identifiant valide n'a pu être extrait
        if (id === undefined || !itemName) {
            console.error("Impossible de déterminer l'identifiant ou le type de l'élément", item);
            return;
        }

        // 4. Validation stricte de l'authentification
        if (!this._resolvedEntryId) {
            console.error("Données d'authentification (entry_id) manquantes. L'intégration n'est pas prête.");
            return;
        }

        // 5. Détermination de la route WebSocket exacte
        const isAddAction = this._searchAction === "add";
        const wsType = isAddAction
            ? "kodi_media_sensors/playlist_add_item"  
            : "kodi_media_sensors/playlist_play_item";

        // 6. Construction et envoi du payload typé pur
        const servicePayload: { type: string } & Record<string, any> = {
            type: wsType,
            entry_id: this._resolvedEntryId,
            item_id: id,
            item_name: itemName,
        };

        if (isAddAction) {
            servicePayload.position =  this._config?.add_position || 1; 
        }

        try {
            await this.hass.connection.sendMessagePromise(servicePayload);
            console.log(`Action WebSocket [${wsType}] exécutée avec succès :`, servicePayload);
        } catch (err) {
            console.error(`Erreur WebSocket retournée par Home Assistant pour [${wsType}] :`, err);
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

