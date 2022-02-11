const SORT_DESC = "Desc";
const MEDIA_TYPE_ALBUM = "album";
const MEDIA_TYPE_ARTIST = "artist";
const MEDIA_TYPE_SONG = "song";
const MEDIA_TYPE_MOVIE = "movie";
const MEDIA_TYPE_TV_SHOW = "tvshow";
const MEDIA_TYPE_EPISODE = "episode";
const MEDIA_TYPE_CHANNEL = "channel";
const MEDIA_TYPE_TV_SHOW_SEASON_DETAILS = "seasondetail";
const MEDIA_TYPE_ALBUM_DETAILS = "albumdetail";

const ACTION_MAP = {
  Play: { icon: "mdi:play", method: "play" },
  Add: { icon: "mdi:plus", method: "add" },
};

const DEFAULT_SHOW_THUMBNAIL = true;
const DEFAULT_SHOW_THUMBNAIL_BORDER = false;
const DEFAULT_SHOW_THUMBNAIL_OVERLAY = true;
const DEFAULT_OUTLINE_COLOR = "white";
const DEFAULT_ALBUM_DETAILS_SORT = SORT_DESC;
const DEFAULT_SHOW_ACTION_MODE = false;
const DEFAULT_ACTION_MODE = Object.keys(ACTION_MAP)[0];
const DEFAULT_ADD_POSITION = 1;
const DEFAULT_ORDER = [
  MEDIA_TYPE_SONG,
  MEDIA_TYPE_ALBUM,
  MEDIA_TYPE_ARTIST,
  MEDIA_TYPE_MOVIE,
  MEDIA_TYPE_TV_SHOW,
  MEDIA_TYPE_EPISODE,
  MEDIA_TYPE_CHANNEL,
];

class SearchSensorCard extends HTMLElement {
  SONG_THUMBNAIL_WIDTH = "65px";
  // the height of the thumbnail of the movie in the search result
  MOVIE_THUMBNAIL_WIDTH = "150px";
  MOVIE_THUMBNAIL_RATIO = 0.8;
  // the height of the epthumbnailsode of the episode in the search result
  EPISODE_THUMBNAIL_WIDTH = "180px";
  EPISODE_THUMBNAIL_RATIO = 1.5;
  // the height and width of the thumbnail of the artist in the search result
  ARTIST_THUMBNAIL_WIDTH = "130px";
  // the height and width of the thumbnail of the album in the search result
  ALBUM_THUMBNAIL_WIDTH = "130px";

  CHANNEL_THUMBNAIL_WIDTH = "180px";
  CHANNEL_THUMBNAIL_RATIO = 1.5;

  BACKGROUND_BASIC_COLOR = "#9b9595";

  _config_show_thumbnail = DEFAULT_SHOW_THUMBNAIL;
  _config_show_thumbnail_border = DEFAULT_SHOW_THUMBNAIL_BORDER;
  _config_outline_color = DEFAULT_OUTLINE_COLOR;
  _config_show_thumbnail_overlay = DEFAULT_SHOW_THUMBNAIL_OVERLAY;
  _config_album_details_sort = DEFAULT_ALBUM_DETAILS_SORT;
  _config_show_action_mode = DEFAULT_SHOW_ACTION_MODE;
  _config_action_mode = DEFAULT_ACTION_MODE;
  _config_add_position = DEFAULT_ADD_POSITION;
  _config_order = DEFAULT_ORDER;

  static async getConfigElement() {
    await import("./kodi-search-card-editor.js");
    return document.createElement("kodi-search-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
      show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
      show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
      outline_color: DEFAULT_OUTLINE_COLOR,
      album_details_sort: DEFAULT_ALBUM_DETAILS_SORT,
      show_action_mode: DEFAULT_SHOW_ACTION_MODE,
      action_mode: DEFAULT_ACTION,
      add_position: DEFAULT_ADD_POSITION,
      order: DEFAULT_ORDER,
    };
  }

  setConfig(config) {
    this._config = config;

    if (!config.entity) {
      // If no entity was specified, this will display a red error card with the message below
      throw new Error("You need to define an entity");
    }
    if (this._config.hasOwnProperty("show_thumbnail")) {
      this._config_show_thumbnail = this._config.show_thumbnail;
    }

    if (this._config.hasOwnProperty("show_thumbnail_border")) {
      this._config_show_thumbnail_border = this._config.show_thumbnail_border;
    }

    if (this._config.hasOwnProperty("outline_color")) {
      this._config_outline_color = this._config.outline_color;
    }

    if (this._config.hasOwnProperty("show_thumbnail_overlay")) {
      this._config_show_thumbnail_overlay = this._config.show_thumbnail_overlay;
    }

    if (this._config.hasOwnProperty("album_details_sort")) {
      this._config_album_details_sort = this._config.album_details_sort;
    }

    if (this._config.hasOwnProperty("show_action_mode")) {
      this._config_show_action_mode = this._config.show_action_mode;
    }

    if (this._config.hasOwnProperty("action_mode")) {
      this._config_action_mode = this._config.action_mode;
    }

    if (this._config.hasOwnProperty("add_position")) {
      this._config_add_position = this._config.add_position;
    }

    if (this._config.hasOwnProperty("order")) {
      this._config_order = this._config.order;
    }

    // Make sure this only runs once
    if (!this.setupComplete) {
      // A ha-card element should be the base of all cards
      // Best practice, and makes themes and stuff work
      const card = document.createElement("ha-card");
      card.header = this._config.title;

      this.content = document.createElement("div");
      card.appendChild(this.content);

      let style = document.createElement("style");
      style.textContent = this.defineCSS();
      this.appendChild(style);

      this.appendChild(card);
      this.setupComplete = true;
    }
    this.createForm();
    this.createMessageKodiOff();
  }

  createMessageKodiOff() {
    this.kodiOffMessageDiv = document.createElement("div");
    this.kodiOffMessageDiv.innerHTML = `<div>Kodi is off</div>`;
    this.kodiOffMessageDiv.setAttribute("class", "container-off");
  }

  createForm(max, json) {
    this.searchFormDiv = document.createElement("div");
    this.searchFormDiv.setAttribute("class", "search-form");

    this.searchInput = document.createElement("paper-input");
    this.searchInput.setAttribute("placeholder", "Search...");
    this.searchInput.setAttribute("id", "kodi_sensor_search_input");
    this.searchInput.addEventListener("keydown", (event) => {
      if (event.code === "Enter") {
        this.search();
      }
    });

    let divBtns = document.createElement("div");
    divBtns.setAttribute("id", "form-btns");

    let searchButton = document.createElement("mwc-button");
    searchButton.setAttribute("id", "form-btn-search");
    searchButton.innerHTML = "Search";
    searchButton.setAttribute("raised", "");
    searchButton.addEventListener("click", () => this.search());
    searchButton.addEventListener("keyup", this.handleSearchInputEvent);

    let cancelButton = document.createElement("mwc-button");
    cancelButton.setAttribute("id", "form-btn-cancel");
    cancelButton.setAttribute("raised", "");
    cancelButton.innerHTML = "Clear";
    cancelButton.addEventListener("click", () => this.clear());

    let recentButton = document.createElement("mwc-button");
    recentButton.setAttribute("id", "form-btn-recent");
    recentButton.setAttribute("raised", "");
    recentButton.innerHTML = "All recently added";
    recentButton.addEventListener("click", () => this.recent());
    divBtns.appendChild(searchButton);
    divBtns.appendChild(recentButton);
    divBtns.appendChild(cancelButton);

    this.searchFormDiv.appendChild(this.searchInput);
    this.searchFormDiv.appendChild(divBtns);
    if (this._config_show_action_mode) {
      this.createActionModeComponent();
    }
  }

  createActionModeComponent() {
    let actionModeContainerOut = document.createElement("div");
    actionModeContainerOut.setAttribute("class", "action-mode-container-out");

    let actionModeContainer = document.createElement("div");
    actionModeContainer.setAttribute("class", "action-mode-container");
    actionModeContainerOut.appendChild(actionModeContainer);

    let actionModeMessage = document.createElement("div");
    actionModeMessage.setAttribute("class", "action-mode-message");
    actionModeMessage.innerHTML = "Action mode";
    actionModeContainer.appendChild(actionModeMessage);

    let tst = document.createElement("div");
    actionModeContainer.appendChild(tst);

    let pb = document.createElement("paper-dropdown-menu-light");
    pb.setAttribute("class", "action-mode-dropdown");
    pb.setAttribute("label", "Choose the action mode");
    tst.appendChild(pb);

    let mapKeyz = Object.keys(ACTION_MAP);
    let lb = document.createElement("paper-listbox");
    lb.setAttribute("selected", mapKeyz.indexOf(this._config_action_mode));
    lb.setAttribute("slot", "dropdown-content");
    lb.addEventListener("iron-select", (e) => this.actionModeChanged(e));
    pb.appendChild(lb);

    for (var i = 0; i < mapKeyz.length; i++) {
      const key = mapKeyz[i];
      let it = document.createElement("paper-item");
      it.setAttribute("value", key);
      it.innerHTML = key;
      lb.appendChild(it);
    }
    this.searchFormDiv.appendChild(actionModeContainerOut);
  }
  renderActionModeButton() {
    this.actionModeLabel.innerHTML = this._config_action_mode;
  }

  renderActionModeIcon() {
    let mapKeys = ACTION_MAP[this._config_action_mode];
    this.actionModeIcon.setAttribute("icon", mapKeys.icon);
  }

  actionModeChanged(event) {
    this._config_action_mode = event.detail.item.getAttribute("value");
    this.fillResultContainer();
  }

  set hass(hass) {
    this._hass = hass;
    // Update the card in case anything has changed
    if (!this._config) return; // Can't assume setConfig is called before hass is set

    const entity = this._config.entity;

    this.state = hass.states[entity];
    if (!this.state) {
      console.error("no state for the sensor");
      return;
    }

    if (this.state.state == "off") {
      this.content.innerHTML = ``;
      this.content.appendChild(this.kodiOffMessageDiv);
    } else {
      let meta = this.state.attributes.meta;
      if (!meta) {
        console.error("no metadata for the sensor");
        return;
      }
      this.json_meta = typeof meta == "object" ? meta : JSON.parse(meta);
      if (this.json_meta.length == 0) {
        console.error("empty metadata attribute");
        return;
      }

      let update_time = this.json_meta[0]["update_time"];
      if (this.last_update_time && this.last_update_time == update_time) {
        console.log("no update available");
        return;
      }

      this.last_update_time = update_time;

      if (this.content.contains(this.kodiOffMessageDiv)) {
        this.content.removeChild(this.kodiOffMessageDiv);
      }

      if (!this.container || !this.content.contains(this.container)) {
        this.container = document.createElement("div");
        this.container.setAttribute("class", "search-container-grid");
        this.container.appendChild(this.searchFormDiv);
        this.content.appendChild(this.container);
      }

      this.fillResultContainer();
    }
  }

  fillResultContainer() {
    if (this.resultDiv && this.container.contains(this.resultDiv)) {
      this.container.removeChild(this.resultDiv);
    }

    this._service_domain = this.json_meta[0]["service_domain"];

    let data = this.state.attributes.data;
    const json = typeof data == "object" ? data : JSON.parse(data);

    if (this.json_meta[0]["search"] && json.length == 0) {
      this.container.appendChild(this.createNoResult());
    } else {
      this.container.appendChild(this.createResult(json));
    }
  }

  getActionIcon() {
    return ACTION_MAP[this._config_action_mode].icon;
  }

  filterTypes(json, value) {
    let result = json.filter((item) => {
      return item.type == value;
    });

    return result;
  }

  createNoResult(json) {
    this.resultDiv = document.createElement("div");
    this.resultDiv.setAttribute("class", "result-div-noresult");
    this.resultDiv.innerHTML = "No result found";
    return this.resultDiv;
  }

  createResult(json) {
    this.resultDiv = document.createElement("div");
    this.resultDiv.setAttribute("class", "search-result-grid");
    this.resultDiv.innerHTML = "";

    for (let index = 0; index < _config_order.length; index++) {
      const media_type = _config_order[index];
      let filtered = this.filterTypes(json, media_type);
      if (filtered.length > 0) {
        this.fillItems(media_type, filtered, this.resultDiv);
      }
    }

    let filtered = this.filterTypes(json, "albumdetail");
    if (filtered.length > 0) {
      this.fillAlbumDetails(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "seasondetail");
    if (filtered.length > 0) {
      this.fillTVShowSeasonDetails(filtered, this.resultDiv);
    }

    return this.resultDiv;
  }

  fillItems(media_type, items, resultDiv) {
    switch (media_type) {
      case MEDIA_TYPE_SONG:
        this.fillSongs(items, resultDiv);
        break;
      case MEDIA_TYPE_ALBUM:
        this.fillAlbums(items, resultDiv);
        break;
      case MEDIA_TYPE_ARTIST:
        this.fillArtists(items, resultDiv);
        break;
      case MEDIA_TYPE_CHANNEL:
        // this.fillChannel(items, resultDiv);
        let channels = json.filter((item) => {
          return item.channeltype == "tv";
        });
        this.fillChannel(channels, this.resultDiv, "tv");

        channels = json.filter((item) => {
          return item.channeltype == "radio";
        });
        this.fillChannel(channels, this.resultDiv, "radio");
        break;
      case MEDIA_TYPE_EPISODE:
        this.fillEpisode(items, resultDiv);
        break;
      case MEDIA_TYPE_MOVIE:
        this.fillMovies(items, resultDiv);
        break;
      case MEDIA_TYPE_TV_SHOW:
        this.fillTvShows(items, resultDiv);
        break;
      case MEDIA_TYPE_TV_SHOW_SEASON_DETAILS:
        this.fillTVShowSeasonDetails(items, resultDiv);
        break;
      case MEDIA_TYPE_ALBUM_DETAILS:
        this.fillAlbumDetails(items, resultDiv);
        break;
    }
  }

  fillSongs(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Songs <ha-icon icon="mdi:music"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let songsDiv = document.createElement("div");
    songsDiv.setAttribute(
      "class",
      "search-songs-grid search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(songsDiv);

    let max = items.length;

    for (let count = 0; count < max; count++) {
      const item = items[count];
      let songDiv = document.createElement("div");
      songDiv.setAttribute("class", "search-song-grid");
      songsDiv.appendChild(songDiv);

      let cover = item["thumbnail"];
      let icon = this.getActionIcon();
      let coverDiv = this.prepareCover(
        cover,
        "search-song-cover",
        "search-song-cover-image",
        "search-song-cover-image-default",
        icon,
        "mdi:music",
        () => this.addSong(item["songid"])
      );
      songDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-song-title search-title");
      titleDiv.innerHTML = item["artist"] + " - " + item["title"];
      songDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "search-song-genre search-genre");
      genreDiv.innerHTML = item["genre"] ? item["genre"] : "undefined";
      songDiv.appendChild(genreDiv);

      let albumDiv = document.createElement("div");
      albumDiv.setAttribute("class", "search-song-album search-album");
      albumDiv.innerHTML = item["album"] + " (" + item["year"] + ")";
      songDiv.appendChild(albumDiv);

      let durationDiv = document.createElement("div");
      durationDiv.setAttribute("class", "search-song-duration search-duration");
      durationDiv.innerHTML = new Date(item["duration"] * 1000)
        .toISOString()
        .substring(11, 19);
      songDiv.appendChild(durationDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillAlbums(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Albums <ha-icon icon="mdi:disc"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let albumsDiv = document.createElement("div");
    albumsDiv.setAttribute(
      "class",
      "search-albums-grid search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(albumsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];

      let albumDiv = document.createElement("div");
      albumDiv.setAttribute("class", "search-album-grid");
      albumsDiv.appendChild(albumDiv);

      let actionIcon = this.getActionIcon();
      let cover = item["thumbnail"];
      let coverDiv = this.prepareCover(
        cover,
        "search-album-cover",
        "search-album-cover-image",
        "search-album-cover-image-default",
        actionIcon,
        "mdi:disc",
        // () => this.playAlbum(item["albumid"])
        () => this.addAlbum(item["albumid"])
      );
      albumDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-album-title search-title");
      titleDiv.innerHTML = item["title"];
      albumDiv.appendChild(titleDiv);

      let artistDiv = document.createElement("div");
      artistDiv.setAttribute("class", "search-album-artist search-artist");
      artistDiv.innerHTML = item["artist"] + " (" + item["year"] + ")";
      albumDiv.appendChild(artistDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillArtists(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML =
      'Artists <ha-icon icon="mdi:account-circle"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let artistsDiv = document.createElement("div");
    artistsDiv.setAttribute(
      "class",
      "search-artists-grid  search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(artistsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let artistDiv = document.createElement("div");
      artistDiv.setAttribute("class", "search-artist-grid");
      artistsDiv.appendChild(artistDiv);

      let cover = item["thumbnail"];
      let coverDiv = this.prepareCover(
        cover,
        "search-artist-cover",
        "search-artist-cover-image",
        "search-artist-cover-image-default",
        "mdi:menu",
        "mdi:disc",
        () => this.searchMoreOfArtist(item["artistid"])
      );
      artistDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-artist-title search-title");
      titleDiv.innerHTML = item["artist"];
      artistDiv.appendChild(titleDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillMovies(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Movies <ha-icon icon="mdi:movie"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let moviesDiv = document.createElement("div");
    moviesDiv.setAttribute(
      "class",
      "search-movies-grid  search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(moviesDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];

      let movieDiv = document.createElement("div");
      movieDiv.setAttribute("class", "search-movie-grid");
      moviesDiv.appendChild(movieDiv);

      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      let icon = this.getActionIcon();
      let coverDiv = this.prepareCover(
        cover,
        "search-movie-cover",
        "search-movie-cover-image",
        "search-movie-cover-image-default",
        icon,
        "mdi:movie",
        () => this.addMovie(item["movieid"])
      );
      movieDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-movie-title search-title");
      titleDiv.innerHTML = item["title"];
      movieDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "search-movie-genre search-genre");
      genreDiv.innerHTML = item["genre"] + " (" + item["year"] + ")";
      movieDiv.appendChild(genreDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillEpisode(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Episodes <ha-icon icon="mdi:movie"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let episodesDiv = document.createElement("div");
    episodesDiv.setAttribute(
      "class",
      "search-episodes-grid  search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(episodesDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];

      let episodeDiv = document.createElement("div");
      episodeDiv.setAttribute("class", "search-episode-grid");
      episodesDiv.appendChild(episodeDiv);

      let icon = this.getActionIcon();
      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      let coverDiv = this.prepareCover(
        cover,
        "search-episode-cover",
        "search-episode-cover-image",
        "search-episode-cover-image-default",
        icon,
        "mdi:movie",
        () => this.addEpisode(item["episodeid"])
      );
      episodeDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-episode-title search-title");
      titleDiv.innerHTML = item["title"];
      episodeDiv.appendChild(titleDiv);

      let tvshowDiv = document.createElement("div");
      tvshowDiv.setAttribute("class", "search-episode-tvshow search-tvshow");
      tvshowDiv.innerHTML =
        item["tvshowtitle"] +
        " (S" +
        item["season"].toString().padStart(2, "0") +
        ":E" +
        item["episode"].toString().padStart(2, "0") +
        ")";
      episodeDiv.appendChild(tvshowDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "search-episode-genre search-genre");
      genreDiv.innerHTML = item["genre"];
      episodeDiv.appendChild(genreDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillTvShows(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'TV Shows <ha-icon icon="mdi:movie"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let tvshowsDiv = document.createElement("div");
    tvshowsDiv.setAttribute(
      "class",
      "search-tvshows-grid  search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(tvshowsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];

      let tvshowDiv = document.createElement("div");
      tvshowDiv.setAttribute("class", "search-tvshow-grid");
      tvshowsDiv.appendChild(tvshowDiv);

      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      let coverDiv = this.prepareCover(
        cover,
        "search-tvshow-cover",
        "search-tvshow-cover-image",
        "search-tvshow-cover-image-default",
        "mdi:menu",
        "mdi:movie",
        () => this.searchMoreOfTvShow(item["tvshowid"])
      );
      tvshowDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-tvshow-title search-title");
      titleDiv.innerHTML = item["title"];
      tvshowDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "search-tvshow-genre search-genre");
      genreDiv.innerHTML = item["genre"] + " (" + item["year"] + ")";
      tvshowDiv.appendChild(genreDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillChannel(items, resultDiv, type) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");

    let iconTitle = type == "tv" ? "mdi:movie" : "mdi:music";
    let labelTitle = type == "tv" ? "TV Channels" : "Radio Channels";

    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML =
      labelTitle + ' <ha-icon icon="' + iconTitle + '"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let channelsDiv = document.createElement("div");
    channelsDiv.setAttribute(
      "class",
      "search-channel-grid search-grid search-item-container-grid"
    );
    rowsDiv.appendChild(channelsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];

      let channelDiv = document.createElement("div");
      channelDiv.setAttribute("class", "search-channel-grid");
      channelsDiv.appendChild(channelDiv);

      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      let icon = this.getActionIcon();
      let coverDiv = this.prepareCover(
        cover,
        "search-channel-cover",
        "search-channel-cover-image",
        "search-channel-cover-image-default",
        icon,
        "mdi:movie",
        () => this.addChannel(item["channelid"])
      );
      channelDiv.appendChild(coverDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "search-channel-title search-title");
      titleDiv.innerHTML = item["label"];
      channelDiv.appendChild(titleDiv);

      let channelTypeDiv = document.createElement("div");
      channelTypeDiv.setAttribute("class", "search-channel-type search-genre");
      channelTypeDiv.innerHTML =
        item["channeltype"] + " ( nr " + item["channelnumber"] + ")";
      channelDiv.appendChild(channelTypeDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillAlbumDetails(items, resultDiv) {
    if (this._config_album_details_sort == SORT_DESC) {
      items.sort((a, b) => parseFloat(b.year) - parseFloat(a.year));
    } else {
      items.sort((a, b) => parseFloat(a.year) - parseFloat(b.year));
    }

    let albumsDiv = document.createElement("div");
    albumsDiv.setAttribute(
      "class",
      "search-albumsdetails-grid search-grid search-item-container-grid"
    );

    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Album Details<ha-icon icon="mdi:disc"></ha-icon>';
    albumsDiv.appendChild(mediaTypeDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let albumDetailsDiv = document.createElement("div");
      albumDetailsDiv.setAttribute(
        "class",
        "search-albumdetails-grid  search-grid"
      );

      let actionIcon = this.getActionIcon();
      let cover = item["thumbnail"];
      let coverDiv = this.prepareCover(
        cover,
        "search-albumdetails-cover",
        "search-albumdetails-cover-image",
        "search-albumdetails-cover-image-default",
        actionIcon,
        "mdi:music",
        // () => this.playAlbum(item["albumid"])
        () => this.addAlbum(item["albumid"])
      );
      albumDetailsDiv.appendChild(coverDiv);

      let albumTitleDiv = document.createElement("div");
      albumTitleDiv.setAttribute(
        "class",
        "search-albumdetails-title search-title"
      );
      albumTitleDiv.innerHTML = item["year"] + " - " + item["title"];
      albumDetailsDiv.appendChild(albumTitleDiv);

      let songsDiv = document.createElement("div");
      songsDiv.setAttribute("class", "search-albumdetails-songs");
      let songsItem = item["songs"];
      let albumDuration = 0;
      for (let idx = 0; idx < songsItem.length; idx++) {
        let songDuration = songsItem[idx]["duration"];
        albumDuration += songDuration;
        let songDiv = document.createElement("div");
        songDiv.setAttribute("class", "search-albumdetails-song-grid");

        let trackDiv = document.createElement("div");
        trackDiv.setAttribute("class", "search-albumdetails-song-track");
        if (songsItem[idx]["track"]) {
          trackDiv.innerHTML = songsItem[idx]["track"] + ".";
        }
        songDiv.appendChild(trackDiv);

        let titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "search-albumdetails-song-title");
        titleDiv.innerHTML = songsItem[idx]["title"];
        songDiv.appendChild(titleDiv);

        let actionIcon = this.getActionIcon();
        let playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", actionIcon);
        playDiv.setAttribute("class", "search-albumdetails-song-play");
        playDiv.addEventListener("click", () =>
          // this.playSong(songsItem[idx]["songid"])
          this.addSong(songsItem[idx]["songid"])
        );
        songDiv.appendChild(playDiv);

        songsDiv.appendChild(songDiv);
      }
      albumDetailsDiv.appendChild(songsDiv);

      let durationDiv = document.createElement("div");
      durationDiv.setAttribute("class", "search-albumdetails-duration");
      durationDiv.innerHTML = this.formatDuration(albumDuration);
      albumDetailsDiv.appendChild(durationDiv);

      albumsDiv.appendChild(albumDetailsDiv);
    }
    resultDiv.appendChild(albumsDiv);
  }

  fillTVShowSeasonDetails(items, resultDiv) {
    let seasonsDiv = document.createElement("div");

    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML =
      'Season Details <ha-icon icon="mdi:movie"></ha-icon>';
    seasonsDiv.appendChild(mediaTypeDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let seasonDiv = document.createElement("div");
      seasonDiv.setAttribute(
        "class",
        "search-seasondetails-grid  search-grid search-item-container-grid"
      );

      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      const episodes = item["episodes"].map((x) => x.episodeid);
      let icon = this.getActionIcon();
      let coverDiv = this.prepareCover(
        cover,
        "search-seasondetails-cover",
        "search-seasondetails-cover-image",
        "search-seasondetails-cover-image-default",
        icon,
        "mdi:movie",
        () => this.addEpisodes(episodes)
      );
      seasonDiv.appendChild(coverDiv);

      let seasonTitleDiv = document.createElement("div");
      seasonTitleDiv.setAttribute(
        "class",
        "search-seasondetails-title search-title"
      );
      seasonTitleDiv.innerHTML = item["title"];
      seasonDiv.appendChild(seasonTitleDiv);

      let episodesDiv = document.createElement("div");
      episodesDiv.setAttribute("class", "search-seasondetails-episodes");
      let episodesItem = item["episodes"];
      for (let idx = 0; idx < episodesItem.length; idx++) {
        let episodeDiv = document.createElement("div");
        episodeDiv.setAttribute("class", "search-seasondetails-episode-grid");

        let trackDiv = document.createElement("div");
        trackDiv.setAttribute("class", "search-seasondetails-episode-track");
        if (episodesItem[idx]["season"] && episodesItem[idx]["season"]) {
          let track =
            episodesItem[idx]["season"] +
            "x" +
            episodesItem[idx]["episode"].toString().padStart(2, "0") +
            ".";
          trackDiv.innerHTML = track;
        }
        episodeDiv.appendChild(trackDiv);

        let titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "search-seasondetails-episode-title");
        titleDiv.innerHTML = episodesItem[idx]["title"];
        episodeDiv.appendChild(titleDiv);

        let playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", "mdi:play");
        playDiv.setAttribute("class", "search-seasondetails-episode-play");
        playDiv.addEventListener("click", () =>
          this.playEpisode(episodesItem[idx]["episodeid"])
        );
        episodeDiv.appendChild(playDiv);

        episodesDiv.appendChild(episodeDiv);
      }
      seasonDiv.appendChild(episodesDiv);

      seasonsDiv.appendChild(seasonDiv);
    }
    resultDiv.appendChild(seasonsDiv);
  }

  prepareCover(
    cover,
    class_cover,
    class_cover_image,
    class_cover_image_default,
    icon_overlay,
    icon_default,
    action_click
  ) {
    let coverDiv = document.createElement("div");
    coverDiv.setAttribute("class", class_cover);

    let coverContainer = document.createElement("div");
    coverContainer.setAttribute("class", "search-cover-container");
    coverDiv.appendChild(coverContainer);

    if (this._config_show_thumbnail && cover && cover != "") {
      let coverImg = document.createElement("img");
      coverImg.setAttribute("src", cover);
      coverImg.onerror = function () {
        coverImg.remove();

        let coverImgDefault = document.createElement("ha-icon");
        coverImgDefault.setAttribute(
          "class",
          "search-cover-image-default " + class_cover_image_default
        );
        coverImgDefault.setAttribute("icon", icon_default);
        coverContainer.appendChild(coverImgDefault);
      };
      coverImg.setAttribute("class", class_cover_image + " search-cover-image");
      coverContainer.appendChild(coverImg);
    } else {
      let coverImgDefault = document.createElement("ha-icon");
      coverImgDefault.setAttribute(
        "class",
        "search-cover-image-default " + class_cover_image_default
      );
      coverImgDefault.setAttribute("icon", icon_default);
      coverContainer.appendChild(coverImgDefault);
    }

    if (!this._config_show_thumbnail_overlay) {
      coverContainer.addEventListener("click", action_click);
    } else if (this._config_show_thumbnail_overlay) {
      let overlayImg = document.createElement("ha-icon");
      overlayImg.setAttribute("class", "overlay-play");
      overlayImg.setAttribute("icon", icon_overlay);
      overlayImg.addEventListener("click", action_click);
      coverContainer.appendChild(overlayImg);
    }

    return coverDiv;
  }

  handleSearchInputEvent(event) {
    var key = event.keyCode || event.which;
    if (key == 13) {
      this.search();
    }
  }

  formatDuration(duration) {
    return new Date(duration * 1000).toISOString().substr(11, 8);
  }

  clear() {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "clear",
    });
    this.searchInput.value = "";
  }

  search() {
    let searchText = this.searchInput.value;
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "search",
      item: {
        media_type: "all",
        value: searchText,
      },
    });
    this.searchInput.value = "";
  }

  recent() {
    let searchText = this.searchInput.value;
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "search",
      item: {
        media_type: "recent",
      },
    });
    this.searchInput.value = "";
  }

  searchMoreOfTvShow(tvshow_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "search",
      item: {
        media_type: "tvshow",
        value: tvshow_id,
      },
    });
  }

  searchMoreOfArtist(artist_id) {
    let searchText = this.searchInput.value;
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "search",
      item: {
        media_type: "artist",
        value: artist_id,
      },
    });
  }

  addItem(item_key, item_id) {
    let meth = ACTION_MAP[this._config_action_mode].method;
    let params = {
      entity_id: this._config.entity,
      method: meth,
    };
    params[item_key.toString()] = item_id;

    if (meth == "add") {
      params.position = parseInt(this._config_add_position, 10);
    }

    this._hass.callService(this._service_domain, "call_method", params);
  }

  addSong(song_id) {
    this.addItem("songid", song_id);
  }

  addAlbum(album_id) {
    this.addItem("albumid", album_id);
  }

  addMovie(movie_id) {
    this.addItem("movieid", movie_id);
  }

  addChannel(channel_id) {
    this.addItem("channelid", channel_id);
  }

  addEpisode(episode_id) {
    this.addItem("episodeid", episode_id);
  }

  addEpisodes(episode_ids) {
    this.addItem("episodeid", episode_ids);
  }

  getCardSize() {
    // let view = this.config.image_style || "poster";
    // return view == "poster" ? window.cardSize * 5 : window.cardSize * 3;
    return 30;
  }

  defineCSS() {
    let css = `

          /*
            -----------------
            ----- NO RESULT -----
            -----------------
          */
            .container-off{
              display: grid;
              grid-template-columns: 1fr auto;
              grid-auto-rows: auto;
              grid-gap: 10px;
              text-align: right;
              font-weight: bold;
              font-size: 18px;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
              border-bottom: solid;
            }

          /*
            -----------------
            ----- FORM -----
            -----------------
          */
            .search-form{
              display: grid;
              grid-template-columns: 1fr auto;
              column-gap: 3px;
              row-gap: 10px;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            #kodi_sensor_search_input{
              grid-column: 1 / 4;
              grid-row: 1;
            }

            #form-btns{
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              align-items: center;
              column-gap: 10px;
              padding: 5px;

              grid-column: 1 ;
              grid-row: 2;
            }

            #form-btn-search{
              grid-column: 1 ;
              grid-row: 1;
            }

            #form-btn-cancel{
              grid-column: 2;
              grid-row: 1;
            }

            #form-btn-recent{
              grid-column: 1 / 3;
              grid-row: 2;
            }


            .action-mode-container-out{
              grid-column: 2;
              grid-row: 2;
              border: 1px solid var(--slider-color);
              border-radius: 10px;
              padding: 10px;
            }

            .action-mode-container{
              display: grid;
              gap: 10px;
            }

            .search-container-grid{
              display: grid;
              grid-gap: 10px;
            }


          .search-result-grid{
            display: grid;
            grid-gap: 50px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }


          .action-mode-dropdown{
            width: 150px;
          }

          /*
            -----------------
            ----- COMMON -----
            -----------------
          */
            .media-type-div, .result-div-noresult{
              font-weight: bold;
              font-size: 18px;
              text-align: right;
              border-bottom: solid;
            }

            .search-cover-container{
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
              opacity:0;
              color: white;
              transition: .5s ease;
              text-align: center;
              --mdc-icon-size: 50px;
            }

            .search-cover-image{
              height:auto !important;
              display: block;
              justify-content:center;
            }

            .search-cover-image-default{
              display:flex;
              justify-content:flex-end;
              align-items:flex-end;
              color: white;
              background-color: ${this.BACKGROUND_BASIC_COLOR};
            }

            .search-title{
              font-weight: bold;
              font-size: 14px;
              vertical-align: text-top;
            }

            .search-duration{
              text-align: right;
            }
            .search-genre{
              font-style: italic;
              vertical-align: text-top;
            }

            .search-grid {
              display: grid;
              column-gap:10px;
              row-gap:10px;
            }

            .search-item-container-grid{
              padding:10px;
            }

            /*
              -----------------
              ----- SONGS -----
              -----------------
            */

            .search-songs-grid{
                grid-template-columns: auto;
                grid-template-rows: auto;
              }


            .search-song-grid{
              display: grid;
              grid-template-columns: auto 1fr auto auto;
              grid-auto-rows: auto;
              column-gap:10px;
            }

            .search-song-cover{
              grid-column: 1;
              grid-row: 1 / 5;
            }

            .search-song-cover-image{
              width: ${this.SONG_THUMBNAIL_WIDTH};
            }

            .search-song-title{
              grid-column: 2 / 5;
              grid-row: 1;
            }

            .search-song-genre{
              grid-column: 2 / 5;
              grid-row: 2;
            }

            .search-song-album{
              grid-column: 2 / 5;
              grid-row: 3;
            }

            .search-song-duration{
              grid-column: 3 / 5;
              grid-row: 3;
            }

            .search-song-cover-image-default{
              width: ${this.SONG_THUMBNAIL_WIDTH};
              height: ${this.SONG_THUMBNAIL_WIDTH};
              --mdc-icon-size: calc(${this.SONG_THUMBNAIL_WIDTH} - 30px);
            }

            /*
            ------------------
            ----- ALBUMS -----
            ------------------
            */
          .search-albums-grid{
            grid-template-columns: repeat(auto-fill, minmax(${this.ALBUM_THUMBNAIL_WIDTH}, 1fr));
            grid-template-rows: auto;
          }

          .search-album-grid{
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto 1fr;
            row-gap: 3px;
          }

          .search-album-cover{
            grid-column: 1 / 2;
            grid-row: 1;
          }

          .search-album-title{
            grid-column: 1 / 3;
            grid-row: 2;
            vertical-align: text-top;
          }

          .search-album-artist{
            grid-column: 1 / 3;
            grid-row: 3 / 4;
            vertical-align: text-top;
          }


          .search-album-cover-image{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
          }

          .search-album-cover-image-default{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            height: ${this.ALBUM_THUMBNAIL_WIDTH};
            --mdc-icon-size: calc(${this.ALBUM_THUMBNAIL_WIDTH} - 30px);
          }

          /*
          -------------------
          ----- ARTISTS -----
          -------------------
          */
        .search-artists-grid{
          grid-template-columns: repeat(auto-fill, minmax(${this.ARTIST_THUMBNAIL_WIDTH}, 1fr));
          grid-template-rows: auto;
        }

        .search-artist-grid{
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto 1fr;
            row-gap: 3px;
        }

        .search-artist-title{
          grid-column: 1;
          grid-row: 2;
        }

        .search-artist-cover{
          grid-column: 1;
          grid-row: 1;
        }

        .search-artist-cover-image{
          width: ${this.ARTIST_THUMBNAIL_WIDTH};
        }

        .search-artist-cover-image-default{
          width: ${this.ARTIST_THUMBNAIL_WIDTH};
          height: ${this.ARTIST_THUMBNAIL_WIDTH};
          --mdc-icon-size: calc(${this.ARTIST_THUMBNAIL_WIDTH} - 30px);
        }


      /*
        ------------------
        ----- MOVIES -----
        ------------------
      */
      .search-movies-grid{
        grid-template-columns: repeat(auto-fill, minmax(${this.MOVIE_THUMBNAIL_WIDTH}, 1fr));
        grid-template-rows: auto;
      }

      .search-movie-grid{
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
      }

      .search-movie-cover{
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-movie-title{
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-movie-genre{
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-movie-cover-image{
        width: ${this.MOVIE_THUMBNAIL_WIDTH};
      }

      .search-movie-cover-image-default{
        width: ${this.MOVIE_THUMBNAIL_WIDTH};
        height: calc(${this.MOVIE_THUMBNAIL_WIDTH} / ${this.MOVIE_THUMBNAIL_RATIO});
        --mdc-icon-size: calc(${this.MOVIE_THUMBNAIL_WIDTH} - 30px);
      }

      /*
      --------------------
      ----- EPISODES -----
      --------------------
      */
      .search-episodes-grid{
        grid-template-columns: repeat(auto-fill, minmax(${this.EPISODE_THUMBNAIL_WIDTH}, 1fr));
        grid-template-rows: auto auto auto 1fr;
      }

      .search-episode-grid{
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto;
        row-gap: 3px;
      }

      .search-episode-cover{
        grid-column: 1 / 2;
        grid-row: 1;
      }

      .search-episode-tvshow{
        grid-column: 1 / 3;
        grid-row: 3;
      }

      .search-episode-title{
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .search-episode-genre{
        grid-column: 1 / 3;
        grid-row: 4;
      }

      .search-episode-cover-image{
        width: ${this.EPISODE_THUMBNAIL_WIDTH};
      }

      .search-episode-cover-image-default{
        width: ${this.EPISODE_THUMBNAIL_WIDTH};
        height: calc(${this.EPISODE_THUMBNAIL_WIDTH} / ${this.EPISODE_THUMBNAIL_RATIO});
        --mdc-icon-size: calc((${this.EPISODE_THUMBNAIL_WIDTH} / ${this.EPISODE_THUMBNAIL_RATIO}) - 30px);
      }

        /*
        --------------------
          ----- TV SHOWS -----
          --------------------
        */
          .search-tvshows-grid{
            grid-template-columns: repeat(auto-fill, minmax(${this.MOVIE_THUMBNAIL_WIDTH}, 1fr));
            grid-template-rows: auto;
          }

          .search-tvshow-grid{
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto 1fr;
            row-gap: 3px;
          }

          .search-tvshow-cover{
            grid-column: 1 / 2;
            grid-row: 1;
          }

          .search-tvshow-title{
              grid-column: 1 / 3;
            grid-row: 2;
          }

          .search-tvshow-genre{
            grid-column: 1 / 3;
            grid-row: 3;
          }

          .search-tvshow-cover-image{
            width: ${this.MOVIE_THUMBNAIL_WIDTH};
          }

          .search-tvshow-cover-image-default{
            width: ${this.MOVIE_THUMBNAIL_WIDTH};
            height: ${this.MOVIE_THUMBNAIL_WIDTH};
            --mdc-icon-size: calc(${this.MOVIE_THUMBNAIL_WIDTH} - 30px);
          }


          /*
          --------------------
            ----- CHANNEL -----
            --------------------
          */
            .search-channel-grid{
              grid-template-columns: repeat(auto-fill, minmax(${this.CHANNEL_THUMBNAIL_WIDTH}, 1fr));
              grid-template-rows: auto;
            }

            .search-channel-grid{
              display: grid;
              grid-template-columns: auto 1fr;
              grid-template-rows: auto auto 1fr;
              row-gap: 3px;
            }

            .search-channel-cover{
              grid-column: 1 / 2;
              grid-row: 1;
            }

            .search-channel-title{
                grid-column: 1 / 3;
              grid-row: 2;
            }

            .search-channel-type{
              grid-column: 1 / 3;
              grid-row: 3;
            }

            .search-channel-cover-image{
              width: ${this.CHANNEL_THUMBNAIL_WIDTH};
            }

            .search-channel-cover-image-default{
              width: ${this.CHANNEL_THUMBNAIL_WIDTH};
              height: calc(${this.CHANNEL_THUMBNAIL_WIDTH} / ${this.CHANNEL_THUMBNAIL_RATIO});
              --mdc-icon-size: calc((${this.CHANNEL_THUMBNAIL_WIDTH} / ${this.CHANNEL_THUMBNAIL_RATIO}) - 30px);
            }



          /*
          ------------------------
          ----- ALBUM DETAIL -----
          ------------------------
          */

          .search-albumsdetails-grid{
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
          }

          .search-albumdetails-grid{
            grid-template-columns: auto 1fr;
            grid-auto-rows: auto;
          }

          .search-albumdetails-cover{
            grid-column: 1 ;
            grid-row: 1 ;
          }

          .search-albumdetails-cover-image{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
          }

          .search-albumdetails-cover-image-default{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            height: ${this.ALBUM_THUMBNAIL_WIDTH};
            --mdc-icon-size: calc(${this.ALBUM_THUMBNAIL_WIDTH} - 30px);
          }

          .search-albumdetails-title{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            grid-column: 1;
            grid-row: 2 ;
            text-align: right;
          }

          .search-albumdetails-duration{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            grid-column: 1;
            grid-row: 3;
            font-style: italic;
            text-align: right;
          }

          .search-albumdetails-songs{
            grid-column: 2;
            grid-row: 1 / 5;
          }

          .search-albumdetails-song-grid{
            display: grid;
            grid-template-columns: auto 1fr 25px;
            grid-auto-rows: auto;
            grid-gap: 5px;
            margin-top: 5px;
            margin-bottom: 5px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .search-albumdetails-song-track{
            grid-column: 1;
            grid-row: 1;
          }

          .search-albumdetails-song-title{
            grid-column: 2;
            grid-row: 1;
          }

          .search-albumdetails-song-play{
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
           .search-seasondetails-grid{
            grid-template-columns: auto 1fr;
            grid-auto-rows: auto;
          }

          .search-seasondetails-cover{
            grid-column: 1 ;
            grid-row: 1 ;
          }

          .search-seasondetails-cover-image{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
          }

          .search-seasondetails-cover-image-default{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            height: ${this.ALBUM_THUMBNAIL_WIDTH};
            --mdc-icon-size: calc(${this.ALBUM_THUMBNAIL_WIDTH} - 30px);
          }

          .search-seasondetails-title{
            width: ${this.ALBUM_THUMBNAIL_WIDTH};
            grid-column: 1;
            grid-row: 2 ;
            text-align: right;
          }

          .search-seasondetails-episodes{
            grid-column: 2 ;
            grid-row: 1 / 4 ;
          }

          .search-seasondetails-episode-grid{
            display: grid;
            grid-template-columns: auto 1fr auto 25px;
            grid-auto-rows: auto;
            grid-gap: 5px;
            margin-top: 5px;
            margin-bottom: 5px;
            margin-left: 10px;
            margin-right: 10px;
          }
          .search-seasondetails-episode-track{
            grid-column: 1;
            grid-row: 1;
          }

          .search-seasondetails-episode-title{
            grid-column: 2;
            grid-row: 1;
          }

          .search-seasondetails-episode-play{
            grid-column: 4;
            grid-row: 1;
            font-size: 10px;
            text-align: right;
          }


        .song-play, .album-play, .artist-play, .movie-play, .tvshow-play, .albumdetails-play, .seasondetails-play, .episode-play, .channel-play{
          display: block;
          color: black;
        }

        .song-play:hover, .album-play:hover, .artist-play:hover, .movie-play:hover, .tvshow-play:hover, .albumdetails-play:hover, .albumdetails-song-play:hover, .seasondetails-play:hover, .seasondetails-episode-play:hover, .episode-play:hover, channel-play:hover{
          color: red;
        }
      `;

    if (this._config_show_thumbnail_border) {
      css +=
        `
           .search-cover-image, .search-cover-image-default{
                  border: 1px solid ` +
        this._config_outline_color +
        `;
      }
      `;
    }

    return css;
  }
}

customElements.define("kodi-search-card", SearchSensorCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "kodi-search-card",
  name: "Kodi Search Card",
  preview: false, // Optional - defaults to false
  description: "Shows the search of Kodi", // Optional
});
