import "./editor";
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { KodiSearchCardConfig } from "./types";

// Type pour les résultats de recherche

interface SearchResultItem {
    title?: string;
    name?: string;
    label?: string;
    artist?: string | string[];
    artistid?: number | string;
    album?: string;
    thumbnail?: string;
    year?: number | string;
    rating?: number;
    duration?: number;
    genre?: string | string[];
    file?: string;
    songs?: SearchResultItem[];
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

    @state() private _sensorState = "unavailable";
    @state() private _isArtistView = false;

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

            .kodi-controls {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .control-gap {
                flex-grow: 1;
            }

            .search-box {
                display: flex;
                align-items: center;
                background: var(--secondary-background-color);
                border-radius: 8px;
                padding: 0 12px;
                height: 40px;
            }
            .search-box input {
                flex: 1;
                border: none;
                background: none;
                outline: none;
                color: var(--primary-text-color);
            }

            .control-toolbar {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap; /* CRUCIAL : autorise le retour à la ligne */
                justify-content: center; /* Centre les éléments si ça passe à la ligne */
                padding: 8px 0;
            }

            .control-actions {
                display: flex;
                background: var(--secondary-background-color);
                border-radius: 8px;
                padding: 2px;
                white-space: nowrap; /* Empêche les boutons de se couper en deux */
            }

            .nav-buttons {
                display: flex;
                gap: 4px;
                flex-wrap: wrap; /* Autorise les icônes à passer à la ligne */
                justify-content: center;
            }

            @media (max-width: 350px) {
                .group button span {
                    display: none;
                } /* Cache le texte des boutons si l'écran est minuscule */
                .group button {
                    padding: 6px 8px;
                }
            }

            .group button {
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                background: transparent;
                color: var(--secondary-text-color);
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .group button.active {
                background: var(--primary-color);
                color: white;
            }

            .separator {
                height: 24px;
                width: 1px;
                background: var(--divider-color);
                margin: 0 4px;
            }

            .icon-btn {
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: background 0.2s;
            }
            .icon-btn:hover {
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

            .album-detailed-row {
                display: flex;
                gap: 20px;
                background: #1c1c1c;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
                border: 1px solid #2d2d2d;
            }

            @media (max-width: 600px) {
                .album-detailed-row {
                    flex-direction: column; /* Devient vertical sur mobile */
                }
            }

            /* Bloc Pochette à gauche */
            .album-detailed-thumb-container {
                width: 120px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .album-detailed-thumb-container .list-thumb-wrapper {
                width: 100px;
                height: 100px;
                margin-bottom: 8px;
            }

            .album-detailed-title {
                font-weight: 600;
                font-size: 0.9rem;
                color: #fff;
                line-height: 1.2;
            }

            .album-detailed-year {
                font-size: 0.8rem;
                color: #8a8a8a;
                margin-top: 2px;
            }

            /* Bloc Liste de Chansons à droite */
            .album-detailed-songs-list {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .album-song-item {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                border-radius: 4px;
                transition: background 0.2s;
                border-bottom: 1px solid #252525;
            }

            .album-song-item:hover {
                background: #2a2a2a;
            }

            .song-index {
                color: #8a8a8a;
                margin-right: 8px;
                width: 20px;
                font-size: 0.85rem;
            }

            .song-title {
                flex-grow: 1;
                color: #ffffff;
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .song-duration {
                color: #8a8a8a;
                font-size: 0.8rem;
                margin-right: 12px;
                font-family: monospace;
            }

            /* Boutons d'actions alignés à droite */
            .song-actions {
                display: flex;
                gap: 4px;
            }

            .song-actions ha-icon {
                --mdc-icon-size: 20px;
                padding: 4px;
            }

            .no-songs-msg {
                color: #8a8a8a;
                font-style: italic;
                padding: 12px;
                font-size: 0.85rem;
            }
        `;
    }

    public setConfig(config: KodiSearchCardConfig): void {
        if (!config || !config.entity) {
            throw new Error("L'entité de configuration Kodi est requise");
        }
        this._config = config;
    }

    protected updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
    }

    protected willUpdate(changedProperties: PropertyValues) {
        super.willUpdate(changedProperties);

        // Dès que HA envoie de nouvelles données, on met à jour nos variables internes
        if (changedProperties.has("hass") || changedProperties.has("_config")) {
            this._resolveConfig();
            this._fetchSensorState();
        }
    }

    private _fetchSensorState(): void {
        if (!this.hass || !this._config?.entity) {
            this._sensorState = "unavailable";
            return;
        }

        const sensorEntity = this.hass.states[this._config.entity];

        if (sensorEntity) {
            this._sensorState = sensorEntity.state;

            console.debug("[Kodi Card] Sensor state:", {
                state: this._sensorState,
            });
        } else {
            this._sensorState = "unavailable";
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
                kodi: this._resolvedKodiEntityId,
            });
        } else {
            console.error("L'entité sélectionnée n'a pas les attributs requis.");
        }
    }

    private _getCurrentArtistInfo(): { id?: number | string } {
        if (!this.hass || !this._config?.entity) return {};
        const stateObj = this.hass.states[this._config.entity];
        if (!stateObj || !stateObj.attributes) return {};

        // Récupération de l'ID injecté côté Python
        const id = stateObj.attributes.current_track?.artist_id || stateObj.attributes.artist_id;
        return { id };
    }

    private async _handleNavigation(type: string): Promise<void> {
        try {
            let wsType = `kodi_media_sensors/search_${type}`;
            const payload: Record<string, any> = {
                entry_id: this._resolvedEntryId || this._config?.entry_id || "",
                kodi_entity_id: this._resolvedKodiEntityId,
            };

            // 🚀 AJOUT : On réinitialise la requête avant de lancer la recherche artiste
            if (type === "current_artist") {
                this._query = "";

                const artistInfo = this._getCurrentArtistInfo();
                if (!artistInfo || !artistInfo.id) {
                    console.warn("Aucun artiste n'est actuellement en cours de lecture.");
                    return;
                }
                wsType = "kodi_media_sensors/search_artist";
                payload.artistid = artistInfo.id;
                delete payload.entry_id;
            }

            const result = await this.hass.callWS<{ items?: SearchResultItem[]; results?: SearchResults }>({
                type: wsType,
                ...payload,
            });

            // Traitement et assignation des résultats
            if (result.results) {
                this._results = result.results;
            } else if (result.items) {
                this._results = { songs: result.items };
            } else {
                this._results = result as unknown as SearchResults;
            }

            // On active la vue détaillée spécifique (Albums + Morceaux dépliés)
            this._isArtistView = type === "current_artist";
        } catch (e) {
            console.error(`Erreur lors de la navigation [${type}]:`, e);
        }
    }

    private _clearAll(): void {
        this._query = "";
        this._results = null;
        this._isArtistView = false;
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
                    <ha-icon class="kodi-icon" icon="mdi:kodi"></ha-icon> ${this._config?.title || "Kodi Search"}
                </h3>
                <div class="status-dot ${statusClass}"></div>
            </div>

            ${this._renderControls()}

            <div class="search-content">${this._results ? this._renderResultsContainer(this._results) : ""}</div>
        `;
    }

    private _renderControls() {
        return html`
            <div class="kodi-controls">
                <div class="search-box">
                    <input
                        .value="${this._query}"
                        @input="${(e: any) => (this._query = e.target.value)}"
                        @keydown="${(e: any) => e.key === "Enter" && this._performSearch()}"
                        placeholder="Rechercher..." />
                    ${this._query
                        ? html` <ha-icon class="icon-btn clear" icon="mdi:close" @click="${this._clearAll}"></ha-icon> `
                        : ""}
                    <ha-icon class="icon-btn search" icon="mdi:magnify" @click="${this._performSearch}"></ha-icon>
                </div>

                <div class="control-toolbar">
                    <div class="control-actions">
                        <button
                            class="${this._searchAction === "play" ? "active" : ""}"
                            @click="${() => (this._searchAction = "play")}">
                            <ha-icon icon="mdi:play-circle-outline"></ha-icon> Jouer
                        </button>
                        <button
                            class="${this._searchAction === "add" ? "active" : ""}"
                            @click="${() => (this._searchAction = "add")}">
                            <ha-icon icon="mdi:playlist-plus"></ha-icon> Ajouter
                        </button>
                    </div>

                    <div class="control-gap"></div>

                    <div class="nav-buttons">
                        ${this._query || this._results
                            ? html`
                                  <ha-icon
                                      icon="mdi:close-circle-outline"
                                      class="icon-btn"
                                      @click="${this._clearAll}"
                                      title="Tout effacer / Accueil"
                                      style="color: var(--error-color);"></ha-icon>
                              `
                            : ""}

                        <ha-icon
                            icon="mdi:history"
                            class="icon-btn"
                            @click="${() => this._handleNavigation("recently_played")}"
                            title="Récemment écouté"></ha-icon>
                        <ha-icon
                            icon="mdi:clock-plus"
                            class="icon-btn"
                            @click="${() => this._handleNavigation("recently_added")}"
                            title="Nouveautés"></ha-icon>
                        <ha-icon
                            icon="mdi:account-music"
                            class="icon-btn"
                            @click="${() => this._handleNavigation("current_artist")}"
                            title="Artiste actuel"></ha-icon>
                    </div>
                </div>
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
        const categoryLower = category.toLowerCase();

        // 🚀 Si on est en vue artiste détaillée pour les albums, rendu spécial !
        if (this._isArtistView && categoryLower === "albums") {
            // Extraction dynamique : on prend _query en priorité, sinon on lit l'album !
            let artistName = this._query;
            if (!artistName && items.length > 0) {
                // Kodi peut utiliser 'artist' ou 'albumartist' (et ça peut être un tableau)
                const rawName = items[0].artist || (items[0] as any).albumartist;
                artistName = Array.isArray(rawName) ? rawName[0] : rawName || "Artiste actuel";
            }

            return html`
                <div class="category-section">
                    <h3 class="category-header">
                        <span>ALBUMS DE : ${artistName.toUpperCase()}</span> <ha-icon icon="mdi:album"></ha-icon>
                    </h3>
                    <div class="artist-detailed-view">${items.map(album => this._renderDetailedAlbumRow(album))}</div>
                </div>
            `;
        }

        // Le reste du code existant (Grid ou List classique) reste inchangé...
        const isGridLayout = ["albums", "artists"].includes(categoryLower);
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

    private _renderDetailedAlbumRow(album: SearchResultItem) {
        const icon = this._getCategoryIcon("albums");
        const resolvedThumbnail = this._getItemThumbnailUrl(album, "albums");

        return html`
            <div class="album-detailed-row">
                <div class="album-detailed-thumb-container">
                    <div class="list-thumb-wrapper">
                        ${this._renderItemThumbnail(resolvedThumbnail, icon, "list-thumb", "albums")}
                    </div>
                    <div class="album-detailed-title">${album.title || album.label}</div>
                    ${album.year ? html`<div class="album-detailed-year">(${album.year})</div>` : ""}
                </div>

                <div class="album-detailed-songs-list">
                    ${album.songs && album.songs.length > 0
                        ? album.songs.map(
                              (song, index) => html`
                                  <div class="album-song-item">
                                      <span class="song-index">${index + 1}.</span>
                                      <span class="song-title">${song.title || song.label}</span>
                                      <span class="song-duration">${this._formatDuration(song.duration)}</span>

                                      <div class="song-actions">
                                          <ha-icon
                                              icon="mdi:play"
                                              class="icon-btn"
                                              title="Jouer"
                                              @click="${() => this._handleDirectAction(song, "play")}"></ha-icon>
                                          <ha-icon
                                              icon="mdi:plus"
                                              class="icon-btn"
                                              title="Ajouter"
                                              @click="${() => this._handleDirectAction(song, "add")}"></ha-icon>
                                      </div>
                                  </div>
                              `,
                          )
                        : html`<div class="no-songs-msg">Aucun morceau trouvé ou format non supporté</div>`}
                </div>
            </div>
        `;
    }

    // Petite méthode utilitaire pour déclencher l'action directement (sans passer par le toggle global)
    private _handleDirectAction(song: SearchResultItem, action: "play" | "add") {
        console.log(`Action DIRECTE: ${action.toUpperCase()} | Song:`, song.title || song.label);
        // Ici l'appel à ton service de média Home Assistant pour Kodi
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

            // Si erreur HTTP (404, etc.), on ne throw pas.
            // On log un warning léger et on retourne une chaîne vide.
            if (!response.ok) {
                console.warn(`Kodi Search: Image inaccessible (${response.status}) pour ${url}`);
                return "";
            }

            const blob = await response.blob();
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => {
                    console.warn("Kodi Search: Erreur lors de la lecture du blob image.");
                    resolve(""); // Retourne vide en cas d'erreur lecture
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            // Capture les erreurs réseau (CORS, offline, etc.)
            console.warn("Kodi Search: Impossible de charger l'image via proxy:", error);
            return ""; // Sécurisation : on retourne une chaîne vide au lieu de planter
        }
    }

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
            case "musicvideos":
                return "mdi:video-music";
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
        const categoryLower = category.toLowerCase();

        if (categoryLower === "artists") {
            this._drillDownArtist(item);
        } else if (categoryLower === "tvshows") {
            console.log(`Action: NAVIGATION TVSHOW | Item:`, item.title || item.label);
            // Traité plus tard, pour l'instant on garde le comportement existant
            this._query = item.title || item.label || "";
        } else {
            const action = this._searchAction;
            console.log(`Action: ${action.toUpperCase()} | Item:`, item.title || item.label);
            // Vos appels de service Kodi existants (play/add)
        }
    }

    private async _drillDownArtist(item: SearchResultItem): Promise<void> {
        if (!this._resolvedEntryId || !this._resolvedKodiEntityId) return;
        if (!item.artistid) return;

        try {
            const result = await this.hass.callWS<SearchResults>({
                type: "kodi_media_sensors/search_artist",
                kodi_entity_id: this._resolvedKodiEntityId,
                artistid: item.artistid,
            });

            this._results = result ?? {};
            this._isArtistView = true;

            // 🚀 CORRECTION : On extrait le nom réel de l'artiste depuis le résultat du back-end !
            const albums = this._results.albums || [];
            if (albums.length > 0 && albums[0].artist) {
                this._query = Array.isArray(albums[0].artist) ? albums[0].artist[0] : albums[0].artist;
            } else {
                // Fallback si l'objet item d'origine avait un nom (depuis la grille des artistes)
                this._query = item.title || item.label || "Artiste";
            }
        } catch (e) {
            console.error(`Erreur lors du drill-down de l'artiste:`, e);
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
}

