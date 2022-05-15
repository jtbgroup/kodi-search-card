/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup, BooleanAttributePart } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { KodiSearchCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators';
import { formfieldDefinition } from '../elements/formfield';
import { selectDefinition } from '../elements/select';
import { switchDefinition } from '../elements/switch';
import { textfieldDefinition } from '../elements/textfield';
import { ACTION_MAP, ALBUM_SORT } from './const';

@customElement('kodi-search-card-editor')
export class KodiSearchCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: KodiSearchCardConfig;

  @state() private _helpers?: any;

  private _initialized = false;

  static elementDefinitions = {
    ...textfieldDefinition,
    ...selectDefinition,
    ...switchDefinition,
    ...formfieldDefinition,
  };

  public setConfig(config: KodiSearchCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _title(): string {
    return this._config?.title || '';
  }

  get _entity(): string {
    return this._config?.entity || '';
  }

  get _show_thumbnail(): boolean {
    return this._config?.show_thumbnail || false;
  }

  get _show_thumbnail_border(): boolean {
    return this._config?.show_thumbnail_border || false;
  }

  get _show_thumbnail_overlay(): boolean {
    return this._config?.show_thumbnail_overlay || false;
  }

  get _outline_color(): string {
    return this._config?.outline_color || '';
  }

  get _album_details_sort(): string {
    return this._config?.album_details_sort || '';
  }

  get _show_action_mode(): boolean {
    return this._config?.show_action_mode || false;
  }

  get _action_mode(): string {
    return this._config?.action_mode || '';
  }

  get _add_position(): number {
    return this._config?.add_position || 0;
  }

  // get _show_warning(): boolean {
  //   return this._config?.show_warning || false;
  // }

  // get _show_error(): boolean {
  //   return this._config?.show_error || false;
  // }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states);

    return html`
      <div class="card-config">
        <div class="config">
          <mwc-select
            naturalMenuWidth
            fixedMenuPosition
            label="Entity (Required)"
            .configValue=${'entity'}
            .value=${this._entity}
            @selected=${this._valueChanged}
            @closed=${(ev) => ev.stopPropagation()}
          >
            ${entities.map((entity) => {
              return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
            })}
          </mwc-select>
        </div>
        <div class="config">
          <mwc-textfield
            label="Title (Optional)"
            .value=${this._title}
            .configValue=${'title'}
            @input=${this._valueChanged}
          ></mwc-textfield>
        </div>
        <div class="config">
          <mwc-formfield label="Show Thumbnail">
            <mwc-switch
              .checked=${this._show_thumbnail !== false}
              .configValue=${'show_thumbnail'}
              @change=${this._valueChanged}
            ></mwc-switch>
          </mwc-formfield>
        </div>
        <div class="config">
          <mwc-formfield label="Show thumbnail overlay">
            <mwc-switch
              .checked=${this._show_thumbnail_overlay !== false}
              .configValue=${'show_thumbnail_overlay'}
              @change=${this._valueChanged}
            ></mwc-switch>
          </mwc-formfield>
        </div>
        <div class="config">
          <mwc-formfield label="Show thumbnail border" }>
            <mwc-switch
              .checked=${this._show_thumbnail_border !== false}
              .configValue=${'show_thumbnail_border'}
              @change=${this._valueChanged}
            ></mwc-switch>
          </mwc-formfield>
        </div>
        <div class="config">
          <mwc-textfield
            label="Outline Color (Optional)"
            .value=${this._outline_color}
            .configValue=${'outline_color'}
            @input=${this._valueChanged}
          ></mwc-textfield>
        </div>
        <div class="config">
          <mwc-select
            naturalMenuWidth
            fixedMenuPosition
            label="Sort Albums for one artist"
            @selected=${this._entityChanged}
            @closed=${(ev) => ev.stopPropagation()}
            .configValue=${'album_details_sort'}
            .value=${this._album_details_sort}
          >
            ${Object.keys(ALBUM_SORT).map((sort) => {
              return html` <mwc-list-item .value="${sort}">${ALBUM_SORT[sort].label}</mwc-list-item> `;
            })}
          </mwc-select>
        </div>
        <div class="config">
          <mwc-formfield label="Show Action Mode Component" }>
            <mwc-switch
              .checked=${this._show_action_mode !== false}
              .configValue=${'show_action_mode'}
              @change=${this._valueChanged}
            ></mwc-switch>
          </mwc-formfield>
        </div>
        <div class="config">
          <mwc-select
            label="Action to do when clicked"
            .configValue=${'action_mode'}
            @selected=${this._entityChanged}
            @closed=${(ev) => ev.stopPropagation()}
            .value=${this._action_mode}
          >
            ${Object.keys(ACTION_MAP).map(
              (action) =>
                html`<mwc-list-item .selected=${this._action_mode == action} value=${action}
                  >${ACTION_MAP[action].label}</mwc-list-item
                >`,
            )}
          </mwc-select>
        </div>
        <div class="config">
          <mwc-textfield
            label="Position where to add the item (if action 'Add')"
            type="number"
            .configValue=${this._add_position}
            .configValue=${'add_position'}
            @input=${this._valueChanged}
          ></mwc-textfield>
        </div>
      </div>
    `;
  }

  private _entityChanged(ev): void {
    this._valueChanged(ev);
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles: CSSResultGroup = css`
    mwc-select,
    mwc-textfield {
      margin-bottom: 16px;
      display: block;
    }
    mwc-formfield {
      padding-bottom: 8px;
    }
    mwc-switch {
      --mdc-theme-secondary: var(--switch-checked-color);
    }

    .card-config {
      display: grid;
      grid-row: 1fr;
      grid-column: auto;
      grid-gap: 5px;
    }
    .config {
      width: 100%;
    }
  `;
}
