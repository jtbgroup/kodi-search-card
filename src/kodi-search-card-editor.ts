import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { KodiSearchCardConfig } from "./types";
import { KodiSearchCardEditor } from "./editor";

interface ConfigEntry {
    entity_id?: string;
    title?: string;
}

@customElement("kodi-search-card-editor")
export class KodiSearchCardEditorElement extends LitElement {
    @property({ attribute: false }) public hass?: any;
    @property({ attribute: false }) public lovelace?: any;

    @state() private _config?: KodiSearchCardConfig;
    @state() private _editor?: KodiSearchCardEditor;
    @state() private _errors: Record<string, string> = {};
    @state() private _kodiIntegrations: ConfigEntry[] = [];

    public setConfig(config: KodiSearchCardConfig): void {
        this._config = config;
        this._editor = new KodiSearchCardEditor(config);
        this._validateConfig();
        this._loadKodiIntegrations();
    }

    private async _loadKodiIntegrations(): Promise<void> {
    if (!this.hass) return;

    try {
        const entries = await this.hass.callWS({ type: "config_entries/get" });
        
        this._kodiIntegrations = entries
            .filter((entry: any) => entry.domain === "kodi_media_sensors")
            .map((entry: any) => ({
                // L'entry_id reste la valeur technique pure
                entry_id: entry.entry_id, 
                domain: entry.domain,
                // Le titre affiché combine le nom et l'ID
                title: `${entry.title || 'Kodi'} (ID: ${entry.entry_id})`,
                state: entry.state
            }));
            
        this.requestUpdate();
    } catch (err) {
        console.error("Erreur chargement intégrations Kodi:", err);
    }
}

    // 3. LA MÉTHODE MANQUANTE : Elle doit être DANS la classe
    private _valueChanged(ev: any, field: string): void {
        const config = { ...this._config, [field]: ev.target.value };
        this.dispatchEvent(
            new CustomEvent("config-changed", {
                detail: { config },
                bubbles: true,
                composed: true,
            }),
        );
    }

    static get properties() {
        return {
            hass: { type: Object },
            _config: { state: true },
        };
    }


    render() {
        if (!this.hass || !this._config) return html``;

        return html`
            <div class="card-config">
                <ha-textfield
                    label="Entity ID"
                    .value="${this._config.entry_id || ""}"
                    @input="${e => this._valueChanged(e, "entity_id")}"></ha-textfield>
            </div>
        `;
    }

    /**
     * Validate the current configuration
     */
    private _validateConfig(): void {
        if (!this._editor) return;
        this._errors = this._editor.validate();
    }
}

