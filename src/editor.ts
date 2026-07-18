/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { 
    ACTION_MAP, 
    ADD_POSITION, 
    ALBUM_SORT,
    DEFAULT_SHOW_THUMBNAIL,
    DEFAULT_SHOW_THUMBNAIL_OVERLAY,
    DEFAULT_SHOW_THUMBNAIL_BORDER,
    DEFAULT_SHOW_ACTION_MODE,
    DEFAULT_SHOW_RECENTLY_ADDED,
    DEFAULT_SHOW_RECENTLY_PLAYED,
    DEFAULT_SHOW_MUSIC_PLAYLIST,
    DEFAULT_SHOW_VERSION,
    DEFAULT_ACTION_MODE,
    DEFAULT_ALBUM_DETAILS_SORT,
    DEFAULT_ADD_POSITION
} from "./const";
import { KodiSearchCardConfig } from "./types";

@customElement("kodi-search-card-editor")
export class KodiSearchCardEditor extends LitElement implements LovelaceCardEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private _config?: KodiSearchCardConfig;

    public setConfig(config: KodiSearchCardConfig): void {
        this._config = {
            show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
            show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
            show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
            show_action_mode: DEFAULT_SHOW_ACTION_MODE,
            show_recently_added: DEFAULT_SHOW_RECENTLY_ADDED,
            show_recently_played: DEFAULT_SHOW_RECENTLY_PLAYED,
            show_current_artist: true,
            show_music_playlist: DEFAULT_SHOW_MUSIC_PLAYLIST,
            show_version: DEFAULT_SHOW_VERSION,
            action_mode: DEFAULT_ACTION_MODE,
            album_details_sort: DEFAULT_ALBUM_DETAILS_SORT,
            add_position: DEFAULT_ADD_POSITION.id,
            ...config
        };
    }

    private _schemaMain = [
        { name: "entity", selector: { entity: { domain: "sensor" } } },
        { name: "title", selector: { text: {} } },
        { name: "show_version", selector: { boolean: {} } },
    ];

    private _schemaThumbnails = [
        {
            type: "grid",
            name: "",
            schema: [
                { name: "show_thumbnail", selector: { boolean: {} } },
                { name: "show_thumbnail_overlay", selector: { boolean: {} } },
                { name: "show_thumbnail_border", selector: { boolean: {} } },
            ],
        }
    ];

    private _schemaShows = [
        {
            type: "grid",
            name: "",
            schema: [
                { name: "show_action_mode", selector: { boolean: {} } },
                { name: "show_recently_added", selector: { boolean: {} } },
                { name: "show_recently_played", selector: { boolean: {} } },
                { name: "show_current_artist", selector: { boolean: {} } },
                { name: "show_music_playlist", selector: { boolean: {} } },
            ],
        }
    ];

    private _schemaMisc = [
        { name: "outline_color", selector: { color_rgb: {} } },
        {
            name: "action_mode",
            selector: {
                select: {
                    mode: "dropdown",
                    options: Object.keys(ACTION_MAP).map(key => ({ value: key, label: ACTION_MAP[key].label })),
                },
            },
        },
        {
            name: "album_details_sort",
            selector: {
                select: {
                    mode: "dropdown",
                    options: Object.keys(ALBUM_SORT).map(key => ({ value: ALBUM_SORT[key].id, label: ALBUM_SORT[key].label })),
                },
            },
        },
        {
            name: "add_position",
            selector: {
                select: {
                    mode: "dropdown",
                    options: Object.keys(ADD_POSITION).map(key => ({ value: key, label: ADD_POSITION[key].label })),
                },
            },
        },
    ];

    private _computeLabel = (schema: { name: string }): string => {
        const labels: Record<string, string> = {
            entity: "Entity",
            title: "Title",
            show_thumbnail: "Show Thumbnail",
            show_thumbnail_overlay: "Show Thumbnail Overlay",
            show_thumbnail_border: "Show Thumbnail Border",
            show_action_mode: "Show Action Mode",
            show_recently_added: "Show Recently Added",
            show_recently_played: "Show Recently Played",
            show_current_artist: "Show Current Artist",
            show_music_playlist: "Show Music Playlists",
            outline_color: "Outline Color (optional)",
            action_mode: "Action Mode",
            album_details_sort: "Album Sort Order",
            add_position: "Position when adding an item",
            show_version: "Show card version",
        };
        return labels[schema.name] ?? schema.name;
    };

    protected render(): TemplateResult | void {
        if (!this.hass || !this._config) return html``;

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${this._schemaMain}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}>
            </ha-form>

            <ha-expansion-panel header="Options des Thumbnails" outlined style="margin-top: 16px; margin-bottom: 16px;">
                <ha-form
                    .hass=${this.hass}
                    .data=${this._config}
                    .schema=${this._schemaThumbnails}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._valueChanged}>
                </ha-form>
            </ha-expansion-panel>

            <ha-expansion-panel header="Options d'Affichage" outlined style="margin-bottom: 16px;">
                <ha-form
                    .hass=${this.hass}
                    .data=${this._config}
                    .schema=${this._schemaShows}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._valueChanged}>
                </ha-form>
            </ha-expansion-panel>

            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${this._schemaMisc}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}>
            </ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        if (!this._config || !this.hass) return;
        
        // On fusionne la nouvelle valeur avec l'ancienne configuration pour garder une structure plate
        this._config = { ...this._config, ...ev.detail.value };
        fireEvent(this, "config-changed", { config: this._config });
    }
}