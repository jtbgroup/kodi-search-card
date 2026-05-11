/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { ACTION_MAP, ALBUM_SORT } from "./const";
import { KodiSearchCardConfig } from "./types";

@customElement("kodi-search-card-editor")
export class KodiSearchCardEditor extends LitElement implements LovelaceCardEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private _config?: KodiSearchCardConfig;
    @state() private _helpers?: any;
    private _initialized = false;

    public setConfig(config: KodiSearchCardConfig): void {
        this._config = config;
        this.loadCardHelpers();
    }

    protected shouldUpdate(): boolean {
        if (!this._initialized) this._initialize();
        return true;
    }

    // ─── Config getters ──────────────────────────────────────────────────────

    get _title():                  string  { return this._config?.title                  ?? ""; }
    get _entity():                 string  { return this._config?.entity                 ?? ""; }
    get _show_thumbnail():         boolean { return this._config?.show_thumbnail          ?? false; }
    get _show_thumbnail_border():  boolean { return this._config?.show_thumbnail_border   ?? false; }
    get _show_thumbnail_overlay(): boolean { return this._config?.show_thumbnail_overlay  ?? false; }
    get _outline_color():          string  { return this._config?.outline_color           ?? ""; }
    get _album_details_sort():     string  { return this._config?.album_details_sort      ?? ""; }
    get _show_action_mode():       boolean { return this._config?.show_action_mode        ?? false; }
    get _show_recently_added():    boolean { return this._config?.show_recently_added     ?? true; }
    get _show_recently_played():   boolean { return this._config?.show_recently_played    ?? true; }
    get _show_current_artist():    boolean { return this._config?.show_current_artist     ?? false; }
    get _action_mode():            string  { return this._config?.action_mode             ?? ""; }
    get _add_position():           number  { return this._config?.add_position            ?? 0; }

    // ─── Render ──────────────────────────────────────────────────────────────

    protected render(): TemplateResult | void {
        if (!this.hass || !this._helpers) return html``;

        this._helpers.importMoreInfoControl("climate");

        const entities = Object.keys(this.hass.states);

        return html`
            <div class="card-config">
                <div class="config">
                    <ha-textfield
                        label="Title"
                        .value=${this._title}
                        .configValue=${"title"}
                        @input=${this._valueChanged}></ha-textfield>
                </div>

                <div class="config">
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        label="Entity"
                        .configValue=${"entity"}
                        .value=${this._entity}
                        @selected=${this._valueChanged}
                        @closed=${(ev: Event) => ev.stopPropagation()}>
                        ${entities.map(
                            entity => html`<ha-list-item .value=${entity}>${entity}</ha-list-item>`,
                        )}
                    </ha-select>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Thumbnail">
                        <ha-switch
                            .checked=${this._show_thumbnail}
                            .configValue=${"show_thumbnail"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Thumbnail Overlay">
                        <ha-switch
                            .checked=${this._show_thumbnail_overlay}
                            .configValue=${"show_thumbnail_overlay"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Thumbnail Border">
                        <ha-switch
                            .checked=${this._show_thumbnail_border}
                            .configValue=${"show_thumbnail_border"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-textfield
                        label="Outline Color (Optional)"
                        .value=${this._outline_color}
                        .configValue=${"outline_color"}
                        @input=${this._valueChanged}></ha-textfield>
                </div>

                <div class="config">
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        label="Sort Albums for one artist"
                        .configValue=${"album_details_sort"}
                        .value=${this._album_details_sort}
                        @selected=${this._valueChanged}
                        @closed=${(ev: Event) => ev.stopPropagation()}>
                        ${Object.keys(ALBUM_SORT).map(
                            sort => html`
                                <ha-list-item .value=${ALBUM_SORT[sort].id}>
                                    ${ALBUM_SORT[sort].label}
                                </ha-list-item>
                            `,
                        )}
                    </ha-select>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Action Mode Component">
                        <ha-switch
                            .checked=${this._show_action_mode}
                            .configValue=${"show_action_mode"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Recently Added Component">
                        <ha-switch
                            .checked=${this._show_recently_added}
                            .configValue=${"show_recently_added"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Recently Played Component">
                        <ha-switch
                            .checked=${this._show_recently_played}
                            .configValue=${"show_recently_played"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-formfield class="switch-wrapper" label="Show Current Artist Releases">
                        <ha-switch
                            .checked=${this._show_current_artist}
                            .configValue=${"show_current_artist"}
                            @change=${this._valueChanged}></ha-switch>
                    </ha-formfield>
                </div>

                <div class="config">
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        label="Action to do when clicked"
                        .configValue=${"action_mode"}
                        .value=${this._action_mode}
                        @selected=${this._valueChanged}
                        @closed=${(ev: Event) => ev.stopPropagation()}>
                        ${Object.keys(ACTION_MAP).map(
                            action => html`
                                <ha-list-item .value=${action}>${ACTION_MAP[action].label}</ha-list-item>
                            `,
                        )}
                    </ha-select>
                </div>

                <div class="config">
                    <ha-textfield
                        label="Position where to add the item (if action 'Add')"
                        type="number"
                        .value=${String(this._add_position)}
                        .configValue=${"add_position"}
                        @input=${this._valueChanged}></ha-textfield>
                </div>
            </div>
        `;
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private _initialize(): void {
        if (this.hass === undefined) return;
        if (this._config === undefined) return;
        if (this._helpers === undefined) return;
        this._initialized = true;
    }

    private async loadCardHelpers(): Promise<void> {
        this._helpers = await (window as any).loadCardHelpers();
    }

    private _valueChanged(ev: Event): void {
        if (!this._config || !this.hass) return;

        const target = ev.target as HTMLElement & {
            configValue?: string;
            value?: string;
            checked?: boolean;
            type?: string;
        };

        if (!target.configValue) return;

        // Guard: skip no-op (ha-select fires @selected on every render)
        if (this[`_${target.configValue}`] === target.value) return;

        if (target.value === "") {
            const tmp = { ...this._config };
            delete tmp[target.configValue];
            this._config = tmp;
        } else {
            let endValue: string | boolean | number | undefined = target.value;

            if (target.checked !== undefined) endValue = target.checked;
            if (target.type === "number" && target.value !== undefined) endValue = Number(target.value);

            this._config = { ...this._config, [target.configValue]: endValue };
        }

        fireEvent(this, "config-changed", { config: this._config });
    }

    // ─── Styles ──────────────────────────────────────────────────────────────

    static get styles(): CSSResultGroup {
        return css`
            ha-textfield,
            ha-formfield,
            ha-select {
                display: block;
            }

            .card-config {
                display: grid;
                grid-row: auto;
                grid-column: 1fr;
                grid-gap: 5px;
            }

            .config {
                width: 100%;
            }
        `;
    }
}
