/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { KodiSearchCardConfig } from './types';
import {
  CARD_VERSION,
  MEDIA_TYPE_PARAMS,
  MEDIA_TYPES_SINGLE_DISPLAY,
  ACTION_MAP,
  SORT_DESC,
  DEFAULT_ADD_POSITION,
  DEFAULT_SHOW_THUMBNAIL,
  DEFAULT_SHOW_THUMBNAIL_OVERLAY,
  DEFAULT_SHOW_ACTION_MODE,
  DEFAULT_ACTION_MODE,
  DEFAULT_ALBUM_DETAILS_SORT,
  DEFAULT_MEDIA_TYPE_ORDER,
  DEFAULT_ENTITY_NAME,
  DEFAULT_SHOW_THUMBNAIL_BORDER,
  DEFAULT_OUTLINE_COLOR,
} from './const';
import { localize } from './localize/localize';
import '@material/mwc-list/mwc-list-item.js';
import '@material/mwc-select/mwc-select.js';
import '@material/mwc-textfield/mwc-textfield.js';
import './editor';

/* eslint no-console: 0 */
console.info(
  `%c  KODI-SEARCH-CARD\n%c  ${localize('common.version')} ${CARD_VERSION}    `,
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

// TODO Name your custom element
@customElement('kodi-search-card')
export class KodiSearchCard extends LitElement {
  private _render_finished = false;
  private _searchInput;

  private _entityState;
  private _json_meta;
  private _service_domain;
  // this is the only config property to be kept because we do not want to change the configuration when switching the action mode in the card (only in the editor)
  private _config_action_mode = DEFAULT_ACTION_MODE;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('kodi-search-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      entity: DEFAULT_ENTITY_NAME,
      show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
      show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
      show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
      outline_color: DEFAULT_OUTLINE_COLOR,
      album_details_sort: DEFAULT_ALBUM_DETAILS_SORT,
      show_action_mode: DEFAULT_SHOW_ACTION_MODE,
      action_mode: DEFAULT_ACTION_MODE,
      add_position: DEFAULT_ADD_POSITION,
      order: DEFAULT_MEDIA_TYPE_ORDER,
    };
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: KodiSearchCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: KodiSearchCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = config;

    if (this.config.action_mode) {
      this._config_action_mode = this.config.action_mode;
    }
    document.documentElement.style.setProperty(
      `--outline_color`,
      this.config.outline_color ? this.config.outline_color : DEFAULT_OUTLINE_COLOR,
    );
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
    this._render_finished = false;
    let errorCardMessage;
    let json;
    const entity = this.config.entity;
    if (!entity) {
      errorCardMessage = 'No Entity defined';
      console.error(errorCardMessage);
    } else {
      this._entityState = this.hass.states[entity];
      if (!this._entityState) {
        errorCardMessage = 'No State for the sensor';
        console.error(errorCardMessage);
      } else {
        if (this._entityState.state == 'off') {
          errorCardMessage = 'Kodi is off';
          console.error(errorCardMessage);
        } else {
          const meta = this._entityState.attributes.meta;
          if (!meta) {
            console.error('no metadata for the sensor');
            return;
          }
          this._json_meta = typeof meta == 'object' ? meta : JSON.parse(meta);
          if (this._json_meta.length == 0) {
            console.error('empty metadata attribute');
            return;
          }
          this._service_domain = this._json_meta[0]['service_domain'];
          const data = this._entityState.attributes.data;
          json = typeof data == 'object' ? data : JSON.parse(data);
        }
      }
    }

    const card = html`
      <ha-card
        .header=${this.config.title ? this.config.title : ''}
        tabindex="0"
        .label=${`Kodi Search ${this.config.entity || 'No Entity Defined'}`}
      >
        ${errorCardMessage ? html`<div>${errorCardMessage}</div>` : this._buildCardContainer()}
      </ha-card>
    `;
    this._render_finished = true;
    return card;
  }

  private _buildCardContainer() {
    return html`<div id="card-container">
      <div>${this._buildSearchForm()}</div>
      <div>${this._buildResultContainer()}</div>
    </div>`;
  }

  private _buildResultContainer() {
    const data = this._entityState.attributes.data;
    const json = typeof data == 'object' ? data : JSON.parse(data);

    if (this._json_meta[0]['search'] && json.length == 0) {
      return html` <div id="card-container-result">${this._buildNoResultContainer()}</div>`;
    } else {
      return html` <div id="card-container-result">${this._buildDataResultContainer(json)}</div>`;
    }
  }

  private _buildNoResultContainer() {
    return html`<div class="result-div-noresult">No result found</div>`;
  }

  private _buildDataResultContainer(json) {
    const media_order = this.config.order ? this.config.order : DEFAULT_MEDIA_TYPE_ORDER;
    return html`
      ${media_order.map((media_type) => this._fillMediaItems(media_type, json))}
      ${MEDIA_TYPES_SINGLE_DISPLAY.map((media_type) => this._fillMediaItems(media_type, json))}
    `;
  }

  private _fillMediaItems(media_type, json) {
    const filtered = this._filterTypes(json, media_type);
    if (filtered.length > 0) {
      return html`<div>
        <div class="media-type-div">
          ${this._getMediaTypeLabel(media_type)} <ha-icon icon=${this._getMediaTypeIcon(media_type)}></ha-icon>
        </div>
        ${this._fillMediaItemData(media_type, filtered)}
      </div>`;
    }
    return html``;
  }

  private _fillMediaItemData(media_type, items) {
    switch (media_type) {
      case MEDIA_TYPE_PARAMS.song.id:
        return this._fillSongs(items);
      case MEDIA_TYPE_PARAMS.album.id:
        return this._fillAlbums(items);
      case MEDIA_TYPE_PARAMS.artist.id:
        return this._fillArtists(items);
      case MEDIA_TYPE_PARAMS.channel.id:
        return this._fillChannels(items);
      case MEDIA_TYPE_PARAMS.episode.id:
        return this._fillEpisodes(items);
      case MEDIA_TYPE_PARAMS.movie.id:
        return this._fillMovies(items);
      case MEDIA_TYPE_PARAMS.tvshow.id:
        return this._fillTvShows(items);
      case MEDIA_TYPE_PARAMS.seasondetail.id:
        return this._fillTVShowSeasonDetails(items);
      case MEDIA_TYPE_PARAMS.albumdetail.id:
        return this._fillAlbumDetails(items);
    }
    return html``;
  }

  private _fillChannels(items) {
    const tvchannels = items.filter((item) => {
      return item.channeltype == 'tv';
    });

    const radiochannels = items.filter((item) => {
      return item.channeltype == 'radio';
    });

    return html`${this._fillChannel(tvchannels, 'tv')} ${this._fillChannel(radiochannels, 'radio')}`;
  }
  private _fillChannel(items, type) {
    return html`
      <div class="search-channels-channeltype">
        ${type == 'tv' ? 'TV Channels' : 'Radio Channels'}
        <ha-icon icon=${type == 'tv' ? 'mdi:movie' : 'mdi:music'}></ha-icon>
      </div>

      <div class="search-channels-grid search-grid search-item-container-grid">
        ${items.map(
          (item) =>
            html`<div class="search-channel-grid">
              ${this._prepareCover(
                item['poster'] && item['poster'] != '' ? item['poster'] : item['thumbnail'],
                'search-channel-cover',
                'search-channel-cover-image',
                'search-channel-cover-image-default',
                this._getActionIcon(),
                'mdi:movie',
                () => this._addChannel(item['channelid']),
              )}
              <div class="search-channel-title search-title">${item['label']}</div>
              <div class="search-channel-type search-genre">${item['channeltype']} ( nr ${item['channelnumber']})</div>
            </div>`,
        )}
      </div>
    `;
  }

  private _fillSongs(items) {
    return html`<div class="search-songs-grid search-grid search-item-container-grid">
      ${items.map(
        (item) => html`<div class="search-song-grid">
          ${this._prepareCover(
            item['thumbnail'],
            'search-song-cover',
            'search-song-cover-image',
            'search-song-cover-image-default',
            this._getActionIcon(),
            'mdi:music',
            () => this._addSong(item['songid']),
          )}
          <div class="search-song-title search-title">${item['artist']} - ${item['title']}</div>
          <div class="search-song-genre search-genre">${item['genre'] ? item['genre'] : 'undefined'}</div>
          <div class="search-song-album search-album">${item['album']} (${item['year']}</div>
          <div class="search-song-duration search-duration">${this._formatDuration(item['duration'])}</div>
        </div>`,
      )}
    </div>`;
  }

  private _formatDuration(duration) {
    return new Date(duration * 1000).toISOString().substring(11, 19);
  }

  private _fillArtists(items) {
    return html`<div class="search-artists-grid search-grid search-item-container-grid">
      ${items.map(
        (item) =>
          html`<div class="search-artist-grid">
            ${this._prepareCover(
              item['thumbnail'],
              'search-artist-cover',
              'search-artist-cover-image',
              'search-artist-cover-image-default',
              'mdi:menu',
              'mdi:disc',
              () => this._searchMoreOfArtist(item['artistid']),
            )}
            <div class='search-artist-title search-title'>${item['artist']}</div>
            </div>
          </div>`,
      )}
    </div> `;
  }

  private _fillAlbums(items) {
    return html`<div class="search-albums-grid search-grid search-item-container-grid">
      ${items.map(
        (item) =>
          html`<div class="search-album-grid">
            ${this._prepareCover(
              item['thumbnail'],
              'search-album-cover',
              'search-album-cover-image',
              'search-album-cover-image-default',
              this._getActionIcon(),
              'mdi:disc',
              () => this._addAlbum(item['albumid']),
            )}
            <div class="search-album-title search-title">${item['title']}</div>
            <div class="search-album-artist search-artist">${item['artist'] + '(' + item['year'] + ')'}</div>
            </div>
          </div>`,
      )}
    </div> `;
  }

  private _fillMovies(items) {
    return html`<div class="search-movies-grid search-grid search-item-container-grid">
      ${items.map(
        (item) =>
          html`<div class="search-movie-grid">
            ${this._prepareCover(
              item['poster'] && item['poster'] != '' ? item['poster'] : item['thumbnail'],
              'search-movie-cover',
              'search-movie-cover-image',
              'search-movie-cover-image-default',
              this._getActionIcon(),
              'mdi:movie',
              () => this._addMovie(item['movieid']),
            )}
            <div class="search-movie-title search-title">${item['title']}</div>
            <div class="search-movie-genre search-genre">${item['genre']} (${item['year']})</div>
          </div>`,
      )}
    </div> `;
  }

  private _fillEpisodes(items) {
    return html`<div class="search-episodes-grid search-grid search-item-container-grid">
      ${items.map(
        (item) =>
          html`<div class="search-episode-grid">
            ${this._prepareCover(
              item['poster'] && item['poster'] != '' ? item['poster'] : item['thumbnail'],
              'search-episode-cover',
              'search-episode-cover-image',
              'search-episode-cover-image-default',
              this._getActionIcon(),
              'mdi:movie',
              () => this._addEpisode(item['episodeid']),
            )}
            <div class="search-episode-title search-title">${item['title']}</div>
            <div class="search-episode-tvshow search-tvshow">
              ${item['tvshowtitle']}
              (S${item['season'].toString().padStart(2, '0')}:E${item['episode'].toString().padStart(2, '0')})
            </div>
            <div class="search-episode-genre search-genre">${item['genre']}</div>
          </div>`,
      )}
    </div> `;
  }

  private _fillTvShows(items) {
    return html`<div class="search-tvshows-grid search-grid search-item-container-grid">
      ${items.map(
        (item) =>
          html`<div class="search-tvshow-grid">
            ${this._prepareCover(
              item['poster'] && item['poster'] != '' ? item['poster'] : item['thumbnail'],
              'search-movie-cover',
              'search-movie-cover-image',
              'search-movie-cover-image-default',
              'mdi:menu',
              'mdi:movie',
              () => this._searchMoreOfTvShow(item['tvshowid']),
            )}
            <div class="search-tvshow-title search-title">${item['title']}</div>
            <div class="search-tvshow-genre search-genre">${item['genre']} (${item['year']})</div>
          </div>`,
      )}
    </div> `;
  }

  private _fillTVShowSeasonDetails(items) {
    return html`
      <div>
        <!-- <div class="media-type-div">Season Details<ha-icon icon="mdi:movie"></ha-icon></div> -->
        ${items.map(
          (season) =>
            html`<div class="search-seasondetails-grid  search-grid search-item-container-grid">
              ${this._prepareCover(
                season['poster'] && season['poster'] != '' ? season['poster'] : season['thumbnail'],
                'search-albumdetails-cover',
                'search-albumdetails-cover-image',
                'search-albumdetails-cover-image-default',
                this._getActionIcon(),
                'mdi:music',
                () => this._addEpisodes(season['episodes'].map((x) => x.episodeid)),
              )}

              <div class="search-seasondetails-title search-title">${season['title']}</div>

              <div class="search-seasondetails-episodes">
                ${season['episodes'].map(
                  (episode) => html` <div class="search-seasondetails-episode-grid">
                    <div class="search-seasondetails-episode-track" id="episode-track-${episode['episodeid']}">
                      ${episode['season'] && episode['episode']
                        ? episode['season'] + 'x' + episode['episode'].toString().padStart(2, '0') + '.'
                        : ''}
                    </div>

                    <div class="search-seasondetails-episode-title" id="episode-title-${episode['episodeid']}">
                      ${episode['title']}
                    </div>
                    ${this._createItemDetailsActionIcon(
                      () => this._addEpisodes(episode['episodeid']),
                      'search-seasondetails-episode-play',
                      ['episode-title-' + episode['episodeid'], 'episode-track-' + episode['episodeid']],
                    )}
                  </div>`,
                )}
              </div>
            </div>`,
        )}
      </div>
    `;
  }

  private _fillAlbumDetails(items) {
    if (this.config.album_details_sort == SORT_DESC) {
      items.sort((a, b) => parseFloat(b.year) - parseFloat(a.year));
    } else {
      items.sort((a, b) => parseFloat(a.year) - parseFloat(b.year));
    }

    const albumDurations = {};
    let albumDuration = 0;
    items.map((album) => {
      album['songs'].map((song) => {
        albumDuration += song['duration'];
      });
      albumDurations[album['albumid']] = albumDuration;
      albumDuration = 0;
    });

    return html`
      <div class="search-albumsdetails-grid search-grid search-item-container-grid">
        <!-- <div class="media-type-div">Album Details<ha-icon icon="mdi:disc"></ha-icon></div> -->
        ${items.map(
          (album) =>
            html`<div class="search-albumdetails-grid  search-grid">
              ${this._prepareCover(
                album['thumbnail'],
                'search-albumdetails-cover',
                'search-albumdetails-cover-image',
                'search-albumdetails-cover-image-default',
                this._getActionIcon(),
                'mdi:music',
                () => this._addAlbum(album['albumid']),
              )}
              <div class="search-albumdetails-title search-title">${album['year']} - ${album['title']}</div>
              <div class="search-albumdetails-songs">
                ${album['songs'].map(
                  (song) => html` <div class="search-albumdetails-song-grid">
                    <div class="search-albumdetails-song-track" id="song-track-${song['songid']}">
                      ${song['track'] ? song['track'] : ''}
                    </div>
                    <div class="search-albumdetails-song-title" id="song-title-${song['songid']}">${song['title']}</div>
                    ${this._createItemDetailsActionIcon(
                      () => this._addSong(song['songid']),
                      'search-albumdetails-song-play',
                      ['song-title-' + song['songid'], 'song-track-' + song['songid']],
                    )}
                  </div>`,
                )}
              </div>
              <div class="search-albumdetails-duration">${this._formatDuration(albumDurations[album['albumid']])}</div>
            </div>`,
        )}
      </div>
    `;
  }
  private _createItemDetailsActionIcon(clickAction, clickActionClass, higlightedElements) {
    const playDiv = document.createElement('ha-icon');
    playDiv.setAttribute('icon', this._getActionIcon());
    playDiv.setAttribute('class', clickActionClass);

    playDiv.addEventListener('click', clickAction);

    playDiv.addEventListener('mouseover', () => this._highlightOver(higlightedElements, true));
    playDiv.addEventListener('mouseout', () => this._highlightOver(higlightedElements, false));

    return html`${playDiv}`;
  }

  private _highlightOver(els, enabled) {
    for (let index = 0; index < els.length; index++) {
      const div = this.shadowRoot?.getElementById(els[index]);

      if (div) {
        let color = 'var(--paper-item-icon-color, #44739e)';
        let weight = 'bold';
        if (!enabled) {
          color = '';
          weight = 'normal';
        }
        div.style.fontWeight = weight;
      } else {
        console.error("can't find element " + els[index]);
      }
    }
  }

  private _prepareCover(
    cover,
    class_cover,
    class_cover_image,
    class_cover_image_default,
    icon_overlay,
    icon_default,
    action_click,
  ) {
    const border = this.config.show_thumbnail_border ? 'cover-image-outline-border' : '';
    const coverDiv = document.createElement('div');
    coverDiv.setAttribute('class', class_cover);

    const coverContainer = document.createElement('div');
    coverContainer.setAttribute('class', 'search-cover-container');
    coverDiv.appendChild(coverContainer);
    if (this.config.show_thumbnail && cover && cover != '') {
      const coverImg = document.createElement('img');
      coverImg.setAttribute('src', cover);
      coverImg.onerror = function () {
        coverImg.remove();

        const coverImgDefault = document.createElement('ha-icon');
        coverImgDefault.setAttribute('class', 'search-cover-image-default ' + class_cover_image_default + ' ' + border);
        coverImgDefault.setAttribute('icon', icon_default);
        coverContainer.appendChild(coverImgDefault);
      };
      coverImg.setAttribute('class', class_cover_image + ' search-cover-image' + ' ' + border);
      coverContainer.appendChild(coverImg);
    } else {
      const coverImgDefault = document.createElement('ha-icon');
      coverImgDefault.setAttribute('class', 'search-cover-image-default ' + class_cover_image_default + ' ' + border);
      coverImgDefault.setAttribute('icon', icon_default);
      coverContainer.appendChild(coverImgDefault);
    }

    if (!this.config.show_thumbnail_overlay) {
      coverContainer.addEventListener('click', action_click);
    } else {
      const overlayImg = document.createElement('ha-icon');
      overlayImg.setAttribute('class', 'overlay-play');
      overlayImg.setAttribute('icon', icon_overlay);
      overlayImg.addEventListener('click', action_click);
      coverContainer.appendChild(overlayImg);
    }

    return html`${coverDiv}`;
  }

  private _getActionIcon() {
    return ACTION_MAP[this._config_action_mode].icon;
  }

  private _getMediaTypeIcon(media_type) {
    return MEDIA_TYPE_PARAMS[media_type].icon;
  }
  private _getMediaTypeLabel(media_type) {
    return MEDIA_TYPE_PARAMS[media_type].label;
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
    this._searchInput.addEventListener('keydown', (event) => {
      if (event.code === 'Enter') {
        this._search();
      }
    });
    return html`
      <div id="search-form">
        ${this._searchInput}
        <div id="form-btns">
          <mwc-button id="form-btn-search" label="Search" raised @click="${this._search}" }></mwc-button>
          <mwc-button id="form-btn-clear" label="Clear" raised @click="${this._clear}"></mwc-button>
          <mwc-button id="form-btn-recent" label="Recent" raised @click="${this._recent}"></mwc-button>
        </div>
        ${this.config.show_action_mode
          ? html`
              <mwc-select @selected=${(e) => this._actionModeChanged(e)} id="form-select-action" label="Action mode">
                ${Object.keys(ACTION_MAP).map(
                  (action) =>
                    html`<mwc-list-item .selected=${this._config_action_mode == action} value=${action}
                      >${ACTION_MAP[action].label}</mwc-list-item
                    >`,
                )}
              </mwc-select>
            `
          : ``}
      </div>
    `;
  }

  private _actionModeChanged(event) {
    if (this._render_finished) {
      const idx = event.detail.index;
      if (event.originalTarget.items_[idx]) {
        const value = event.originalTarget.items_[idx].value;
        this._config_action_mode = value;
        this.render();
        this.requestUpdate();
      }
    }
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      :root {
        --outline_color: '-----';
      }

      :host {
        --album-thumbnail-width: 130px;
        --song-thumbnail-width: 65px;
        --movie-thumbnail-width: 150px;
        --movie-thumbnail-ratio: 0.8;
        --channel-thumbnail-width: 180px;
        --channel-thumbnail-ratio: 1.5;
        --artist-thumbnail-width: 130px;
        --episode-thumbnail-width: 180px;
        --episode-thumbnail-ratio: 1.5;
        --background-basic-color: #9b9595;
        --container-rows-gap: 10px;
        --mdc-select-fill-color: rgba(0, 0, 0, 0);
      }

      /*
            -----------------
            ----- COMMON -----
            -----------------
          */
      .media-type-div,
      .result-div-noresult {
        font-weight: bold;
        font-size: 18px;
        text-align: right;
        border-bottom: solid;
      }

      .search-cover-container {
        position: relative;
      }

      .search-cover-container:hover .overlay-play {
        opacity: 1;
      }

      .overlay-play {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        color: white;
        transition: 0.5s ease;
        text-align: center;
        --mdc-icon-size: 50px;
      }

      .search-cover-image {
        height: auto !important;
        display: block;
        justify-content: center;
      }

      .search-cover-image-default {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        color: white;
        background-color: var(--background-basic-color);
      }

      .search-title {
        font-weight: bold;
        font-size: 14px;
        vertical-align: text-top;
      }

      .search-duration {
        text-align: right;
      }
      .search-genre {
        font-style: italic;
        vertical-align: text-top;
      }

      .search-grid {
        display: grid;
        column-gap: 10px;
        row-gap: 10px;
      }

      .search-item-container-grid {
        padding: 10px;
      }

      .search-detail-highlighted {
        background: red;
      }

      .search-detail-normal {
        background: green;
      }

      #card-container {
        margin-top: 20px;
        margin-bottom: 20px;
        margin-left: 10px;
        margin-right: 10px;

        display: grid;
        grid-template-rows: auto;
        grid-template-columns: auto;
        row-gap: var(--container-rows-gap);
      }

      #card-container-result {
        display: grid;
        grid-template-rows: auto;
        grid-template-columns: auto;
        row-gap: var(--container-rows-gap);
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

      /*
              -----------------
              ----- SONGS -----
              -----------------
            */

      .search-songs-grid {
        grid-template-columns: auto;
        grid-template-rows: auto;
      }

      .search-song-grid {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        grid-auto-rows: auto;
        column-gap: 10px;
      }

      .search-song-cover {
        grid-column: 1;
        grid-row: 1 / 5;
      }

      .search-song-cover-image {
        width: var(--song-thumbnail-width);
      }

      .search-song-title {
        grid-column: 2 / 5;
        grid-row: 1;
      }

      .search-song-genre {
        grid-column: 2 / 5;
        grid-row: 2;
      }

      .search-song-album {
        grid-column: 2 / 5;
        grid-row: 3;
      }

      .search-song-duration {
        grid-column: 3 / 5;
        grid-row: 3;
      }

      .search-song-cover-image-default {
        width: var(--song-thumbnail-width);
        height: var(--song-thumbnail-width);
        --mdc-icon-size: calc(var(--song-thumbnail-width) - 30px);
      }

      /*
            ------------------
            ----- ALBUMS -----
            ------------------
            */
      .search-albums-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--album-thumbnail-width), 1fr));
        grid-template-rows: auto;
      }

      .search-album-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
      }

      .search-album-cover {
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-album-title {
        grid-column: 1 / 3;
        grid-row: 2;
        vertical-align: text-top;
      }

      .search-album-artist {
        grid-column: 1 / 3;
        grid-row: 3 / 4;
        vertical-align: text-top;
      }

      .search-album-cover-image {
        width: var(--album-thumbnail-width);
      }

      .search-album-cover-image-default {
        width: var(--album-thumbnail-width);
        height: var(--album-thumbnail-width);
        --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
      }

      /*
          -------------------
          ----- ARTISTS -----
          -------------------
          */
      .search-artists-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--artist-thumbnail-width), 1fr));
        grid-template-rows: auto;
      }

      .search-artist-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        row-gap: 3px;
      }

      .search-artist-title {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-artist-cover {
        grid-column: 1;
        grid-row: 1;
      }

      .search-artist-cover-image {
        width: var(--artist-thumbnail-width);
      }

      .search-artist-cover-image-default {
        width: var(--artist-thumbnail-width);
        height: var(--artist-thumbnail-width);
        --mdc-icon-size: calc(var(--artist-thumbnail-width) - 30px);
      }

      /*
        ------------------
        ----- MOVIES -----
        ------------------
      */
      .search-movies-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
        grid-template-rows: auto;
      }

      .search-movie-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
      }

      .search-movie-cover {
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-movie-title {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-movie-genre {
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-movie-cover-image {
        width: var(--movie-thumbnail-width);
      }

      .search-movie-cover-image-default {
        width: var(--movie-thumbnail-width);
        height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
        --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
      }

      /*
            --------------------
            ----- CHANNEL -----
            --------------------
          */
      .search-channels-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
        grid-template-rows: auto;
      }

      .search-channel-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
      }

      .search-channel-cover {
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-channel-title {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-channel-type {
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-channel-cover-image {
        width: var(--movie-thumbnail-width);
      }

      .search-channel-cover-image-default {
        width: var(--movie-thumbnail-width);
        height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
        --mdc-icon-size: calc((var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio)) - 30px);
      }

      .search-channels-channeltype {
        text-align: right;
        font-weight: bold;
        font-size: 18px;
        padding-top: 20px;
      }

      /*
      --------------------
      ----- EPISODES -----
      --------------------
      */
      .search-episodes-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--episode-thumbnail-width), 1fr));
        grid-template-rows: auto auto auto 1fr;
      }

      .search-episode-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto;
        row-gap: 3px;
      }

      .search-episode-cover {
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-episode-tvshow {
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-episode-title {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-episode-genre {
        grid-column: 1 / 3;
        grid-row: 4;
      }

      .search-episode-cover-image {
        width: var(--episode-thumbnail-width);
      }

      .search-episode-cover-image-default {
        width: var(--episode-thumbnail-width);
        height: calc(var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio));
        --mdc-icon-size: calc((var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio)) - 30px);
      }

      /*
        --------------------
          ----- TV SHOWS -----
          --------------------
        */
      .search-tvshows-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--movie-thumbnail-width), 1fr));
        grid-template-rows: auto;
      }

      .search-tvshow-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
      }

      .search-tvshow-cover {
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-tvshow-title {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-tvshow-genre {
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-tvshow-cover-image {
        width: var(--movie-thumbnail-width);
      }

      .search-tvshow-cover-image-default {
        width: var(--movie-thumbnail-width);
        height: var(--movie-thumbnail-width);
        --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
      }

      /*
          ------------------------
          ----- ALBUM DETAIL -----
          ------------------------
          */

      .search-albumsdetails-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }

      .search-albumdetails-grid {
        grid-template-columns: auto 1fr;
        grid-auto-rows: auto;
        border-bottom: solid;
      }

      .search-albumdetails-cover {
        grid-column: 1;
        grid-row: 1;
      }

      .search-albumdetails-cover-image {
        width: var(--album-thumbnail-width);
      }

      .search-albumdetails-cover-image-default {
        width: var(--album-thumbnail-width);
        height: var(--album-thumbnail-width);
        --mdc-icon-size: calc(var(--album-thumbnail-width)- 30px);
      }

      .search-albumdetails-title {
        width: var(--album-thumbnail-width);
        grid-column: 1;
        grid-row: 2;
        text-align: right;
      }

      .search-albumdetails-duration {
        width: var(--album-thumbnail-width);
        grid-column: 1;
        grid-row: 3;
        font-style: italic;
        text-align: right;
      }

      .search-albumdetails-songs {
        grid-column: 2;
        grid-row: 1 / 5;
      }

      .search-albumdetails-song-grid {
        display: grid;
        grid-template-columns: auto 1fr 25px;
        grid-auto-rows: auto;
        grid-gap: 5px;
        margin-top: 5px;
        margin-bottom: 5px;
        margin-left: 10px;
        margin-right: 10px;
      }

      .search-albumdetails-song-track {
        grid-column: 1;
        grid-row: 1;
      }

      .search-albumdetails-song-title {
        grid-column: 2;
        grid-row: 1;
      }

      .search-albumdetails-song-play {
        grid-column: 3;
        grid-row: 1;
        font-size: 10px;
        text-align: right;
      }

      /*
              --------------------------------
              ----- SEASON DETAIL -----
              --------------------------------
            */
      .search-seasondetails-grid {
        grid-template-columns: auto 1fr;
        grid-auto-rows: auto;
        border-bottom: solid;
      }

      .search-seasondetails-cover {
        grid-column: 1;
        grid-row: 1;
      }

      .search-seasondetails-cover-image {
        width: var(--album-thumbnail-width);
      }

      .search-seasondetails-cover-image-default {
        width: var(--album-thumbnail-width);
        height: var(--album-thumbnail-width);
        --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
      }

      .search-seasondetails-title {
        width: var(--album-thumbnail-width);
        grid-column: 1;
        grid-row: 2;
        text-align: right;
      }

      .search-seasondetails-episodes {
        grid-column: 2;
        grid-row: 1 / 4;
      }

      .search-seasondetails-episode-grid {
        display: grid;
        grid-template-columns: auto 1fr auto 25px;
        grid-auto-rows: auto;
        grid-gap: 5px;
        margin-top: 5px;
        margin-bottom: 5px;
        margin-left: 10px;
        margin-right: 10px;
      }
      .search-seasondetails-episode-track {
        grid-column: 1;
        grid-row: 1;
      }

      .search-seasondetails-episode-title {
        grid-column: 2;
        grid-row: 1;
      }

      .search-seasondetails-episode-play {
        grid-column: 4;
        grid-row: 1;
        font-size: 10px;
        text-align: right;
      }

      /* OTHER */
      .song-play,
      .album-play,
      .artist-play,
      .movie-play,
      .tvshow-play,
      .albumdetails-play,
      .seasondetails-play,
      .episode-play,
      .channel-play {
        display: block;
        color: black;
      }

      .song-play:hover,
      .album-play:hover,
      .artist-play:hover,
      .movie-play:hover,
      .tvshow-play:hover,
      .albumdetails-play:hover,
      .albumdetails-song-play:hover,
      .seasondetails-play:hover,
      .seasondetails-episode-play:hover,
      .episode-play:hover,
      channel-play:hover {
        color: red;
      }

      .cover-image-outline-border {
        border: 1px solid var(--outline_color);
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

  private _addSong(song_id) {
    this._addItem('songid', song_id);
  }

  private _addAlbum(album_id) {
    this._addItem('albumid', album_id);
  }
  private _addMovie(movie_id) {
    this._addItem('movieid', movie_id);
  }
  private _addEpisode(episode_id) {
    this._addItem('episodeid', episode_id);
  }

  private _addEpisodes(episode_ids) {
    this._addItem('episodeid', episode_ids);
  }

  private _addChannel(channel_id) {
    this._addItem('channelid', channel_id);
  }

  private _searchMoreOfArtist(artist_id) {
    this.hass.callService(this._service_domain, 'call_method', {
      entity_id: this.config.entity,
      method: 'search',
      item: {
        media_type: 'artist',
        value: artist_id,
      },
    });
  }

  private _searchMoreOfTvShow(tvshow_id) {
    this.hass.callService(this._service_domain, 'call_method', {
      entity_id: this.config.entity,
      method: 'search',
      item: {
        media_type: 'tvshow',
        value: tvshow_id,
      },
    });
  }

  private _addItem(item_key, item_id) {
    const meth = ACTION_MAP[this._config_action_mode].method;
    const params = {
      entity_id: this.config.entity,
      method: meth,
      position: DEFAULT_ADD_POSITION,
    };
    params[item_key.toString()] = item_id;

    if (meth == 'add') {
      params.position = this.config.add_position ? this.config.add_position : '0';
    }

    this.hass.callService(this._service_domain, 'call_method', params);
  }
}
