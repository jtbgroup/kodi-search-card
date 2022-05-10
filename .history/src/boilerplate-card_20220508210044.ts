/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import '@material/mwc-list/mwc-list-item.js';
import '@material/mwc-select/mwc-select.js';
import '@material/mwc-textfield/mwc-textfield.js';
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

/* eslint no-console: 0 */
console.info(
  `%c  BOILERPLATE-CARD\n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'boilerplate-card',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

// TODO Name your custom element
@customElement('boilerplate-card')
export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
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

    this.config = {
      name: 'Boilerplatesssssssssssssss',
      ...config,
    };
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
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    return html`
      <ha-card
        .header=${this.config.name}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Boilerplatel;pl;pl;p;l: ${this.config.entity || 'No Entity Definedl;l;l;'}`}
      >
      ${this._buildSearchForm()}
    
    </ha-card>
    `;
  }

  private _buildSearchForm(){
    return html`
      <div class='search-form'>
        <mwc-textfield id='form_input_search' outlined label='here'></mwc-textfield>
        <mwc-button id="form-btn-search" outlined label='Search' raised></mwc-button>
        <mwc-button id="form-btn-clear" outlined label='Clear' raised></mwc-button>
        <mwc-button id="form-btn-recent" outlined label='Recent' raised></mwc-button>
        <mwc-select id="form-select-action" outlined label="filled">
          <mwc-list-item></mwc-list-item>
          <mwc-list-item value="0">Item 0</mwc-list-item>
          <mwc-list-item value="1">Item 1</mwc-list-item>
          <mwc-list-item value="2">Item 2</mwc-list-item>
          <mwc-list-item value="3">Item 3</mwc-list-item>
       </mwc-select>
      </div>
    `
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
    /*
            -----------------
            ----- FORM -----
            -----------------
          */
            .search-form{
              display: grid;
              grid-template-columns: 1fr 1fr auto;
              column-gap: 10px;
              row-gap: 10px;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
              align-items: center;
            }

            #form_input_search{
              grid-column: 1 / 4;
              grid-row: 1;
            }

            #form_select_action{
              grid-column: 4;
              grid-row: 2 / 3 ;
              align-items: center;
            }

            /* #form-btns{
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              align-items: center;
              gap: 10px;
              padding: 5px;

              grid-column: 1 ;
              grid-row: 2;
            } */

            #form-btn-search{
              grid-column: 1 ;
              grid-row: 2;
            }

            #form-btn-clear{
              grid-column: 2;
              grid-row: 2;
            }

            #form-btn-recent{
              grid-column: 1 / 3;
              grid-row: 3;
            }
    `;
  }
}
