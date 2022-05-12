/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import '@material/mwc-list/mwc-list-item.js';
import '@material/mwc-select/mwc-select.js';
import '@material/mwc-textfield/mwc-textfield.js';
import './editor';

/* eslint no-console: 0 */
console.info(
  `%c  BOILERPLATE-CARD\n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'kodi-search-card',
  name: 'Kodi Search Card',
  description: 'A template custom card for you to create something awesome',
});
const MEDIA_TYPE_ALBUM = 'album';
const MEDIA_TYPE_ARTIST = 'artist';
const MEDIA_TYPE_SONG = 'song';
const MEDIA_TYPE_MOVIE = 'movie';
const MEDIA_TYPE_TV_SHOW = 'tvshow';
const MEDIA_TYPE_EPISODE = 'episode';
const MEDIA_TYPE_CHANNEL = 'channel';
const MEDIA_TYPE_TV_SHOW_SEASON_DETAILS = 'seasondetail';
const MEDIA_TYPE_ALBUM_DETAILS = 'albumdetail';

const MEDIA_TYPE_PARAMS = {
  album: ['Albums', 'mdi:music'],
  artist: ['Artists', 'mdi:music'],
  song: ['Songs', 'mdi:music'],
  movie: ['Movies', 'mdi:movie'],
  tvshow: ['TV Shows', 'mdi:movie'],
  episode: ['Episodes', 'mdi:movie'],
  channel: ['Channels', 'mdi:movie'],
};

const DEFAULT_ORDER = [
  MEDIA_TYPE_SONG,
  MEDIA_TYPE_ALBUM,
  MEDIA_TYPE_ARTIST,
  MEDIA_TYPE_MOVIE,
  MEDIA_TYPE_TV_SHOW,
  MEDIA_TYPE_EPISODE,
  MEDIA_TYPE_CHANNEL,
];

// TODO Name your custom element
@customElement('kodi-search-card')
export class BoilerplateCard extends LitElement {
  private _service_domain;
  private _searchInput;
  private _config_order = DEFAULT_ORDER;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('boilerplate-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: BoilerplateCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = { name: 'Test', ...config };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    // if (this.config.show_warning) {
    //   return this._showWarning(localize('common.show_warning'));
    // }

    // if (this.config.show_error) {
    //   return this._showError(localize('common.show_error'));
    // }

    let errorCardMessage;
    let json;
    const entity = this.config.entity;
    if (!entity) {
      errorCardMessage = 'No Entity defined';
      console.error(errorCardMessage);
    } else {
      const entityState = this.hass.states[entity];
      if (!entityState) {
        errorCardMessage = 'No State for the sensor';
        console.error(errorCardMessage);
      } else {
        if (entityState.state == 'off') {
          errorCardMessage = 'Kodi is off';
          console.error(errorCardMessage);
        } else {
          const meta = entityState.attributes.meta;
          if (!meta) {
            console.error('no metadata for the sensor');
            return;
          }
          const json_meta = typeof meta == 'object' ? meta : JSON.parse(meta);
          if (json_meta.length == 0) {
            console.error('empty metadata attribute');
            return;
          }
          this._service_domain = json_meta[0]['service_domain'];
          const data = entityState.attributes.data;
          json = typeof data == 'object' ? data : JSON.parse(data);
        }
      }
    }

    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
        .label=${`Kodi Search ${this.config.entity || 'No Entity Defined'}`}
      >
        ${errorCardMessage ? html`<div>${errorCardMessage}</div>` : this._buildCardContainer(json)}
      </ha-card>
    `;
  }

  private _buildCardContainer(json) {
    return html`<div>
      <div>${this._buildSearchForm()}</div>
      <div class="bordered">${this._buildResultContainer(json)}</div>
    </div>`;
  }

  private _buildResultContainer(json) {
    return html` ${this._config_order.map((media_type) => this._fillMediaItems(media_type, json))} `;
    // return html`
    // ${ for (let index = 0; index < this._config_order.length; index++) {
    //   const media_type = this._config_order[index];
    //   const filtered = this.filterTypes(json, media_type);
    //   if (filtered.length > 0) {
    //     this.fillItems(media_type, filtered, this.resultDiv);
    //   }
    // }
    // }`;
  }
  private _fillMediaItems(media_type, json) {
    const filtered = this._filterTypes(json, media_type);
    if (filtered.length > 0) {
      // this._fillMediaItems(media_type, filtered);
      return html`<div class="media-type-div">
        ${this._getMediaTypeLabel(media_type)}<ha-icon icon=${this._getMediaTypeIcon(media_type)}></ha-icon>
      </div>`;
    }
    return html``;
  }

  private _getMediaTypeIcon(media_type) {
    return MEDIA_TYPE_PARAMS[media_type][1];
  }
  private _getMediaTypeLabel(media_type) {
    return MEDIA_TYPE_PARAMS[media_type][0];
  }

  private _filterTypes(json, value) {
    const result = json.filter((item) => {
      return item.type == value;
    });

    return result;
  }

  private _buildSearchForm() {
    this._searchInput = document.createElement('mwc-textfield');
    this._searchInput.setAttribute('id', 'form_input_search');
    this._searchInput.setAttribute('outlined', '');
    this._searchInput.setAttribute('label', 'Search criteria');

    return html`
      <div id="search-form">
        ${this._searchInput}
        <div id="form-btns">
          <mwc-button id="form-btn-search" label="Searchhhhhh" raised @click="${this._search}" }></mwc-button>
          <mwc-button id="form-btn-clear" label="Clear" raised @click="${this._clear}"></mwc-button>
          <mwc-button id="form-btn-recent" label="Recent" raised @click="${this._recent}"></mwc-button>
        </div>
        <mwc-select id="form-select-action" label="Action mode">
          <mwc-list-item></mwc-list-item>
          <mwc-list-item value="0">Item 0</mwc-list-item>
          <mwc-list-item value="1">Item 1</mwc-list-item>
          <mwc-list-item value="2">Item 2</mwc-list-item>
          <mwc-list-item value="3">Item 3</mwc-list-item>
        </mwc-select>
      </div>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .bordered {
        border: 1px solid red;
      }

      .media-type-div,
      .result-div-noresult {
        font-weight: bold;
        font-size: 18px;
        text-align: right;
        border-bottom: solid;
      }

      /*
            -----------------
            ----- FORM -----
            -----------------
          */
      #search-form {
        display: grid;
        grid-template-columns: 1fr auto;
        column-gap: 10px;
        row-gap: 10px;
        margin-top: 20px;
        margin-bottom: 20px;
        margin-left: 10px;
        margin-right: 10px;
        align-items: center;
        border: 1px solid green;
      }

      #form_input_search {
        grid-column: 1 / 3;
        grid-row: 1;
      }

      #form_select_action {
        grid-column: 4;
        grid-row: 2 / 3;
        align-items: center;
      }

      #form-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        align-items: center;
        gap: 10px;
        padding: 5px;

        grid-column: 1;
        grid-row: 2;
      }

      mwc-button[raised] {
        --mdc-theme-primary: var(--primary-color);
        --mdc-theme-on-primary: var(--text-primary-color);
      }

      #form-btn-search {
        grid-column: 1;
        grid-row: 1;
        color: var(--mdc-theme-on-primary);
      }

      #form-btn-clear {
        grid-column: 2;
        grid-row: 1;
      }

      #form-btn-recent {
        grid-column: 1 / 3;
        grid-row: 2;
      }
    `;
  }

  private _clear() {
    this.hass.callService(this._service_domain, 'call_method', {
      entity_id: this.config.entity,
      method: 'clear',
    });
    if (this._searchInput) {
      this._searchInput.value = '';
    }
  }

  private _search() {
    let searchText;
    if (this._searchInput) {
      searchText = this._searchInput.value;
      this._searchInput.value = '';
      this.hass.callService(this._service_domain, 'call_method', {
        entity_id: this.config.entity,
        method: 'search',
        item: {
          media_type: 'all',
          value: searchText,
        },
      });
    }
  }

  private _recent() {
    this.hass.callService(this._service_domain, 'call_method', {
      entity_id: this.config.entity,
      method: 'search',
      item: {
        media_type: 'recent',
      },
    });
    if (this._searchInput) {
      this._searchInput.value = '';
    }
  }
}
