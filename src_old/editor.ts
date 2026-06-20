/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { ACTION_MAP, ALBUM_SORT } from "./const";
import { KodiSearchCardConfig } from "./types";

@customElement("kodi-search-card-editor")
export class KodiSearchCardEditor extends LitElement implements LovelaceCardEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private _config?: KodiSearchCardConfig;

    public setConfig(config: KodiSearchCardConfig): void {
        this._config = config;
    }

    private _schema = [
        {
            name: "entity",
            selector: { entity: { domain: "sensor" } },
        },
        {
            name: "title",
            selector: { text: {} },
        },
        {
            type: "grid",
            name: "",
            schema: [
                { name: "show_thumbnail", selector: { boolean: {} } },
                { name: "show_thumbnail_overlay", selector: { boolean: {} } },
                { name: "show_thumbnail_border", selector: { boolean: {} } },
                { name: "show_action_mode", selector: { boolean: {} } },
                { name: "show_recently_added", selector: { boolean: {} } },
                { name: "show_recently_played", selector: { boolean: {} } },
                { name: "show_current_artist", selector: { boolean: {} } },
            ],
        },
        {
            name: "outline_color",
            selector: { text: {} },
        },
        {
            name: "action_mode",
            selector: {
                select: {
                    mode: "dropdown",
                    options: Object.keys(ACTION_MAP).map(key => ({
                        value: key,
                        label: ACTION_MAP[key].label,
                    })),
                },
            },
        },
        {
            name: "album_details_sort",
            selector: {
                select: {
                    mode: "dropdown",
                    options: Object.keys(ALBUM_SORT).map(key => ({
                        value: ALBUM_SORT[key].id,
                        label: ALBUM_SORT[key].label,
                    })),
                },
            },
        },
        {
            name: "add_position",
            selector: { number: { min: 0, mode: "box" } },
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
            outline_color: "Outline Color (optional)",
            action_mode: "Action Mode",
            album_details_sort: "Album Sort Order",
            add_position: "Add Position (if action = Add)",
        };
        return labels[schema.name] ?? schema.name;
    };

    protected render(): TemplateResult | void {
        if (!this.hass || !this._config) return html``;

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${this._schema}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}>
            </ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        if (!this._config || !this.hass) return;
        this._config = ev.detail.value;
        fireEvent(this, "config-changed", { config: this._config });
    }
}

