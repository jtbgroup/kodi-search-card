const DEFAULT_SHOW_THUMBNAIL = true;
const DEFAULT_SHOW_THUMBNAIL_BORDER = false;
const DEFAULT_SHOW_THUMBNAIL_OVERLAY = true;
const DEFAULT_THUMBNAIL_BORDER_COLOR = "white";

class PlaylistSearchCard extends HTMLElement {
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
  _config_thumbnail_border_color = DEFAULT_THUMBNAIL_BORDER_COLOR;
  _config_show_thumbnail_overlay = DEFAULT_SHOW_THUMBNAIL_OVERLAY;

  static async getConfigElement() {
    await import("./kodi-search-card-editor.js");
    return document.createElement("kodi-search-card-editor");
  }

  static getStubConfig() {
    return {
      entity: _config.entity,
      show_thumbnail: DEFAULT_SHOW_THUMBNAIL,
      show_thumbnail_border: DEFAULT_SHOW_THUMBNAIL_BORDER,
      show_thumbnail_overlay: DEFAULT_SHOW_THUMBNAIL_OVERLAY,
      thumbnail_border_color: DEFAULT_THUMBNAIL_BORDER_COLOR,
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

    if (this._config.hasOwnProperty("thumbnail_border_color")) {
      this._config_thumbnail_border_color = this._config.thumbnail_border_color;
    }

    if (this._config.hasOwnProperty("show_thumbnail_overlay")) {
      this._config_show_thumbnail_overlay = this._config.show_thumbnail_overlay;
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

      this.createForm();
      this.createMessageKodiOff();
    }
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

    this.searchFormDiv.appendChild(this.searchInput);
    this.searchFormDiv.appendChild(searchButton);
    this.searchFormDiv.appendChild(recentButton);
    this.searchFormDiv.appendChild(cancelButton);
  }

  set hass(hass) {
    this._hass = hass;
    // Update the card in case anything has changed
    if (!this._config) return; // Can't assume setConfig is called before hass is set

    const entity = this._config.entity;

    let state = hass.states[entity];
    if (!state) {
      console.error("no state for the sensor");
      return;
    }

    if (state.state == "off") {
      this.content.innerHTML = ``;
      this.content.appendChild(this.kodiOffMessageDiv);
    } else {
      let meta = state.attributes.meta;
      if (!meta) {
        console.error("no metadata for the sensor");
        return;
      }
      const json_meta = typeof meta == "object" ? meta : JSON.parse(meta);
      if (json_meta.length == 0) {
        console.error("empty metadata attribute");
        return;
      }

      let update_time = json_meta[0]["update_time"];
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

      if (this.resultDiv && this.container.contains(this.resultDiv)) {
        this.container.removeChild(this.resultDiv);
      }

      this._service_domain = json_meta[0]["service_domain"];

      let data = state.attributes.data;
      const json = typeof data == "object" ? data : JSON.parse(data);

      if (json_meta[0]["search"] && json.length == 0) {
        this.container.appendChild(this.createNoResult());
      } else {
        this.container.appendChild(this.createResult(json));
      }
    }
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

    let filtered = this.filterTypes(json, "song");
    if (filtered.length > 0) {
      this.fillSongs(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "album");
    if (filtered.length > 0) {
      this.fillAlbums(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "artist");
    if (filtered.length > 0) {
      this.fillArtists(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "movie");
    if (filtered.length > 0) {
      this.fillMovies(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "tvshow");
    if (filtered.length > 0) {
      this.fillTvShows(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "albumdetail");
    if (filtered.length > 0) {
      this.fillAlbumDetails(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "seasondetail");
    if (filtered.length > 0) {
      this.fillTVShowSeasonDetails(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "episode");
    if (filtered.length > 0) {
      this.fillEpisode(filtered, this.resultDiv);
    }

    filtered = this.filterTypes(json, "channel");
    if (filtered.length > 0) {
      this.fillChannel(filtered, this.resultDiv);
    }

    return this.resultDiv;
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
      let coverDiv = this.prepareCover(
        cover,
        "search-song-cover",
        "search-song-cover-image",
        "search-song-cover-image-default",
        "mdi:play",
        "mdi:music",
        () => this.playSong(item["songid"])
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

      let cover = item["thumbnail"];
      let coverDiv = this.prepareCover(
        cover,
        "search-album-cover",
        "search-album-cover-image",
        "search-album-cover-image-default",
        "mdi:play",
        "mdi:disc",
        () => this.playAlbum(item["albumid"])
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

      let coverDiv = this.prepareCover(
        cover,
        "search-movie-cover",
        "search-movie-cover-image",
        "search-movie-cover-image-default",
        "mdi:play",
        "mdi:movie",
        () => this.playMovie(item["movieid"])
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

      let cover =
        item["poster"] && item["poster"] != ""
          ? item["poster"]
          : item["thumbnail"];

      let coverDiv = this.prepareCover(
        cover,
        "search-episode-cover",
        "search-episode-cover-image",
        "search-episode-cover-image-default",
        "mdi:play",
        "mdi:movie",
        () => this.playEpisode(item["episodeid"])
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

  fillChannel(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media-type-div");
    mediaTypeDiv.innerHTML = 'Channels <ha-icon icon="mdi:movie"></ha-icon>';
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

      let coverDiv = this.prepareCover(
        cover,
        "search-channel-cover",
        "search-channel-cover-image",
        "search-channel-cover-image-default",
        "mdi:play",
        "mdi:movie",
        () => this.playChannel(item["channelid"])
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

      let cover = item["thumbnail"];
      let coverDiv = this.prepareCover(
        cover,
        "search-albumdetails-cover",
        "search-albumdetails-cover-image",
        "search-albumdetails-cover-image-default",
        "mdi:play",
        "mdi:music",
        () => this.playAlbum(item["albumid"])
      );
      albumDetailsDiv.appendChild(coverDiv);

      let albumTitleDiv = document.createElement("div");
      albumTitleDiv.setAttribute(
        "class",
        "search-albumdetails-title search-title"
      );
      albumTitleDiv.innerHTML = item["title"] + " (" + item["year"] + ")";
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

        let durationDiv = document.createElement("div");
        durationDiv.innerHTML = this.formatDuration(songDuration);
        durationDiv.setAttribute("class", "search-albumdetails-song-duration");
        songDiv.appendChild(durationDiv);

        let playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", "mdi:play");
        playDiv.setAttribute("class", "search-albumdetails-song-play");
        playDiv.addEventListener("click", () =>
          this.playSong(songsItem[idx]["songid"])
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
      let coverDiv = this.prepareCover(
        cover,
        "search-seasondetails-cover",
        "search-seasondetails-cover-image",
        "search-seasondetails-cover-image-default",
        "mdi:play",
        "mdi:movie",
        () => this.playEpisodes(episodes)
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

  playSong(song_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      songid: song_id,
    });
  }

  playAlbum(album_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      albumid: album_id,
    });
  }

  playMovie(movie_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      movieid: movie_id,
    });
  }

  playChannel(channel_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      channelid: channel_id,
    });
  }

  playEpisode(episode_id) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      episodeid: episode_id,
    });
  }

  playEpisodes(episode_ids) {
    this._hass.callService(this._service_domain, "call_method", {
      entity_id: this._config.entity,
      method: "play",
      episodeid: episode_ids,
    });
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
              grid-template-columns: 50% 50%;
              grid-gap: 3px;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            #kodi_sensor_search_input{
              grid-column: 1 / 3;
              grid-row: 1;
            }

            #form-btn-search{
              grid-column: 1 / 3;
              grid-row: 2;
              margin-bottom: 30px;
            }

            #form-btn-cancel{
              grid-column: 2;
              grid-row: 3;
            }

            #form-btn-recent{
              grid-column: 1;
              grid-row: 3;
            }

            .search-container-grid{
              display: grid;
              grid-gap: 50px;
            }


          .search-result-grid{
            display: grid;
            grid-gap: 50px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
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
              // margin-top: 20px;
              // margin-bottom: 20px;
              // margin-left: 10px;
              // margin-right: 10px;
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
            // row-gap:20px;
          }

          .search-albumdetails-grid{
            grid-template-columns: auto 1fr auto;
            grid-auto-rows: auto;
          }

          .search-albumdetails-cover{
            grid-column: 1 ;
            grid-row: 1 / 3;
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
            grid-column: 2;
            grid-row: 1;
          }

          .search-albumdetails-duration{
            grid-column: 3;
            grid-row: 1;
            font-weight: bold;
          }

          .search-albumdetails-songs{
            grid-column: 2 / 4;
            grid-row: 2 ;
          }

          .search-albumdetails-song-grid{
            display: grid;
            grid-template-columns: auto 1fr auto 25px;
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

          .search-albumdetails-song-duration{
            grid-column: 3;
            grid-row: 1;
          }

          .search-albumdetails-song-play{
            grid-column: 4;
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
            grid-template-columns: auto 1fr auto;
            grid-auto-rows: auto;
          }

          .search-seasondetails-cover{
            grid-column: 1 ;
            grid-row: 1 / 3;
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
            grid-column: 2;
            grid-row: 1;
          }



          .search-seasondetails-episodes{
            grid-column: 2 / 4;
            grid-row: 2 ;
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


          .search-seasondetails-episode-duration{
            grid-column: 3;
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
        this._config_thumbnail_border_color +
        `;
      }
      `;
    }

    return css;
  }
}
customElements.define("kodi-search-card", PlaylistSearchCard);
