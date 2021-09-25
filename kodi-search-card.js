class PlaylistSearchCard extends HTMLElement {
  SONG_THUMBNAIL_MIN_SIZE = "65px";
  ALBUMDETAIL_THUMBNAIL_MIN_SIZE = "100px";
  // the height of the thumbnail of the movie in the search result
  MOVIE_THUMBNAIL_MIN_SIZE = "200px";
  MOVIE_THUMBNAIL_RATIO = 0.6;
  // the height and width of the thumbnail of the artist in the search result
  ARTIST_THUMBNAIL_MIN_SIZE = "100px";
  // the height and width of the thumbnail of the album in the search result
  ALBUM_THUMBNAIL_MIN_SIZE = "170px";

  BACKGROUND_BASIC_COLOR = "#9b9595";

  setConfig(config) {
    this._config = config;

    if (!config.entity) {
      // If no entity was specified, this will display a red error card with the message below
      throw new Error("You need to define an entity");
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
        this.container.setAttribute("class", "container-grid");
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
      return item.object_type == value;
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
    this.resultDiv.setAttribute("class", "result-grid");
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

    return this.resultDiv;
  }

  fillSongs(items, resultDiv) {
    let songsDiv = document.createElement("div");

    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML = 'Songs <ha-icon icon="mdi:music"></ha-icon>';
    songsDiv.appendChild(mediaTypeDiv);

    let max = items.length;

    for (let count = 0; count < max; count++) {
      const item = items[count];
      let rowDiv = document.createElement("div");
      rowDiv.setAttribute("class", "song-inner-item");

      let thumbnailDiv = document.createElement("div");
      thumbnailDiv.setAttribute("class", "song-thumbnailCell");
      if (this._config.show_thumbnail) {
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
      }
      rowDiv.appendChild(thumbnailDiv);

      if (this._config.show_thumbnail && item["thumbnail"] != "") {
        let thumbnailPlayDiv = document.createElement("ha-icon");
        thumbnailPlayDiv.setAttribute("class", "song-thumbnailPlayCell");
        thumbnailPlayDiv.setAttribute("icon", "mdi:play");
        thumbnailPlayDiv.addEventListener("click", () =>
          this.playSong(item["songid"])
        );
        thumbnailDiv.appendChild(thumbnailPlayDiv);
      }

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "song-titleCell");
      titleDiv.innerHTML = item["artist"] + " - " + item["title"];
      rowDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "song-genreCell");
      genreDiv.innerHTML = item["genre"] ? item["genre"] : "undefined";
      rowDiv.appendChild(genreDiv);

      let albumDiv = document.createElement("div");
      albumDiv.setAttribute("class", "song-albumCell");
      albumDiv.innerHTML = item["album"] + " (" + item["year"] + ")";
      rowDiv.appendChild(albumDiv);

      let durationDiv = document.createElement("div");
      durationDiv.setAttribute("class", "song-durationCell");
      durationDiv.innerHTML = new Date(item["duration"] * 1000)
        .toISOString()
        .substr(11, 8);
      rowDiv.appendChild(durationDiv);

      songsDiv.appendChild(rowDiv);
    }
    resultDiv.appendChild(songsDiv);
  }

  fillTVShowSeasonDetails(items, resultDiv) {
    let seasonsDiv = document.createElement("div");

    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML =
      'Season Details <ha-icon icon="mdi:movie"></ha-icon>';
    seasonsDiv.appendChild(mediaTypeDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let rowDiv = document.createElement("div");
      rowDiv.setAttribute("class", "tvshow-seasondetails-inner-item");

      if (this._config.show_thumbnail) {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute(
          "class",
          "tvshow-seasondetails-thumbnailCell"
        );
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        rowDiv.appendChild(thumbnailDiv);
      }

      const episodes = item["episodes"].map((x) => x.episodeid);

      let thumbnailPlayDiv = document.createElement("ha-icon");
      thumbnailPlayDiv.setAttribute(
        "class",
        "tvshow-seasondetails-thumbnailPlayCell"
      );
      thumbnailPlayDiv.setAttribute("icon", "mdi:play");
      thumbnailPlayDiv.addEventListener("click", () =>
        this.playEpisodes(episodes)
      );
      rowDiv.appendChild(thumbnailPlayDiv);

      let seasonTitleDiv = document.createElement("div");
      seasonTitleDiv.setAttribute("class", "tvshow-seasondetails-titleCell");
      seasonTitleDiv.innerHTML = item["title"];
      rowDiv.appendChild(seasonTitleDiv);

      let episodesDiv = document.createElement("div");
      episodesDiv.setAttribute("class", "tvshow-seasondetails-episodesCell");
      let episodesItem = item["episodes"];
      for (let idx = 0; idx < episodesItem.length; idx++) {
        let episodeDiv = document.createElement("div");
        episodeDiv.setAttribute(
          "class",
          "tvshow-seasondetails-episode-inner-item"
        );

        let titleDiv = document.createElement("div");
        titleDiv.setAttribute(
          "class",
          "tvshow-seasondetails-episode-titleCell"
        );
        titleDiv.innerHTML = episodesItem[idx]["label"];
        episodeDiv.appendChild(titleDiv);

        let playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", "mdi:play");
        playDiv.setAttribute(
          "class",
          "tvshow-seasondetails-episode-thumbnailPlayCell"
        );
        playDiv.addEventListener("click", () =>
          this.playEpisode(episodesItem[idx]["episodeid"])
        );
        episodeDiv.appendChild(playDiv);

        episodesDiv.appendChild(episodeDiv);
      }
      rowDiv.appendChild(episodesDiv);

      seasonsDiv.appendChild(rowDiv);
    }
    resultDiv.appendChild(seasonsDiv);
  }

  fillAlbumDetails(items, resultDiv) {
    let albumsDiv = document.createElement("div");

    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML = 'Album Details<ha-icon icon="mdi:disc"></ha-icon>';
    albumsDiv.appendChild(mediaTypeDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let rowDiv = document.createElement("div");
      rowDiv.setAttribute("class", "albumdetails-inner-item");

      if (this._config.show_thumbnail) {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute("class", "albumdetails-thumbnailCell");
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        rowDiv.appendChild(thumbnailDiv);
      }

      let thumbnailPlayDiv = document.createElement("ha-icon");
      thumbnailPlayDiv.setAttribute("class", "albumdetails-thumbnailPlayCell");
      thumbnailPlayDiv.setAttribute("icon", "mdi:play");
      thumbnailPlayDiv.addEventListener("click", () =>
        this.playAlbum(item["albumid"])
      );
      rowDiv.appendChild(thumbnailPlayDiv);

      let albumTitleDiv = document.createElement("div");
      albumTitleDiv.setAttribute("class", "albumdetails-titleCell");
      albumTitleDiv.innerHTML = item["title"];
      rowDiv.appendChild(albumTitleDiv);

      let yearDiv = document.createElement("div");
      yearDiv.setAttribute("class", "albumdetails-yearCell");
      yearDiv.innerHTML = item["year"];
      rowDiv.appendChild(yearDiv);

      let songsDiv = document.createElement("div");
      songsDiv.setAttribute("class", "albumdetails-songsCell");
      let songsItem = item["songs"];
      let albumDuration = 0;
      for (let idx = 0; idx < songsItem.length; idx++) {
        let songDuration = songsItem[idx]["duration"];
        albumDuration += songDuration;
        let songDiv = document.createElement("div");
        songDiv.setAttribute("class", "albumdetails-song-inner-item");

        let titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "albumdetails-song-titleCell");
        titleDiv.innerHTML =
          songsItem[idx]["track"] + ". " + songsItem[idx]["title"];
        if (songDuration) {
          titleDiv.innerHTML += " (" + this.formatDuration(songDuration) + ")";
        }
        songDiv.appendChild(titleDiv);

        let playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", "mdi:play");
        playDiv.setAttribute("class", "albumdetails-song-thumbnailPlayCell");
        playDiv.addEventListener("click", () =>
          this.playSong(songsItem[idx]["songid"])
        );
        songDiv.appendChild(playDiv);

        songsDiv.appendChild(songDiv);
      }
      rowDiv.appendChild(songsDiv);

      let durationDiv = document.createElement("div");
      durationDiv.setAttribute("class", "albumdetails-durationCell");
      rowDiv.appendChild(durationDiv);

      albumsDiv.appendChild(rowDiv);
    }
    resultDiv.appendChild(albumsDiv);
  }

  fillAlbums(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML = 'Albums <ha-icon icon="mdi:disc"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let albumsDiv = document.createElement("div");
    albumsDiv.setAttribute("class", "albums-grid");
    rowsDiv.appendChild(albumsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let albumCardDiv = document.createElement("div");
      albumCardDiv.setAttribute("class", "album-card");
      albumsDiv.appendChild(albumCardDiv);

      if (this._config.show_thumbnail && ["thumbnail"] != "") {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute("class", "album-card-thumbnail");
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        albumCardDiv.appendChild(thumbnailDiv);
      }

      let playDiv = document.createElement("ha-icon");
      playDiv.setAttribute("class", "album-card-play");
      playDiv.setAttribute("icon", "mdi:play");
      playDiv.addEventListener("click", () => this.playAlbum(item["albumid"]));
      albumCardDiv.appendChild(playDiv);

      let dataDiv = document.createElement("div");
      dataDiv.setAttribute("class", "album-card-data");
      albumCardDiv.appendChild(dataDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "album-card-title");
      titleDiv.innerHTML = item["title"];
      dataDiv.appendChild(titleDiv);

      let artistDiv = document.createElement("div");
      artistDiv.setAttribute("class", "album-card-artist");
      artistDiv.innerHTML = item["artist"] + " (" + item["year"] + ")";
      dataDiv.appendChild(artistDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillArtists(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML =
      'Artists <ha-icon icon="mdi:account-circle"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let artistsDiv = document.createElement("div");
    artistsDiv.setAttribute("class", "artists-grid");
    rowsDiv.appendChild(artistsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let artistcardDiv = document.createElement("div");
      artistcardDiv.setAttribute("class", "artist-card");
      artistsDiv.appendChild(artistcardDiv);

      let thumbnailDiv = document.createElement("ha-icon");
      thumbnailDiv.setAttribute("class", "artist-card-thumbnail");
      thumbnailDiv.setAttribute("icon", "mdi:account-circle");
      artistcardDiv.appendChild(thumbnailDiv);

      let moreDetailDiv = document.createElement("ha-icon");
      moreDetailDiv.setAttribute("class", "artist-card-play");
      moreDetailDiv.setAttribute("icon", "mdi:menu");
      moreDetailDiv.addEventListener("click", () =>
        this.searchMoreOfArtist(item["artistid"])
      );
      artistcardDiv.appendChild(moreDetailDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "artist-card-title");
      titleDiv.innerHTML = item["artist"];
      artistcardDiv.appendChild(titleDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  fillMovies(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML = 'Movies <ha-icon icon="mdi:movie"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let moviesDiv = document.createElement("div");
    moviesDiv.setAttribute("class", "movies-grid");
    rowsDiv.appendChild(moviesDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let movieCardDiv = document.createElement("div");
      movieCardDiv.setAttribute("class", "movie-card");
      moviesDiv.appendChild(movieCardDiv);

      if (this._config.show_thumbnail && item["thumbnail"] != "") {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute("class", "movie-card-thumbnail");
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        movieCardDiv.appendChild(thumbnailDiv);
      }

      let playDiv = document.createElement("ha-icon");
      playDiv.setAttribute("class", "movie-card-play");
      playDiv.setAttribute("icon", "mdi:play");
      playDiv.addEventListener("click", () => this.playMovie(item["movieid"]));
      movieCardDiv.appendChild(playDiv);

      let dataDiv = document.createElement("div");
      dataDiv.setAttribute("class", "movie-card-data");
      movieCardDiv.appendChild(dataDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "movie-card-title");
      titleDiv.innerHTML = item["title"];
      dataDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "movie-card-genre");
      genreDiv.innerHTML = item["genre"] + " (" + item["year"] + ")";
      dataDiv.appendChild(genreDiv);
    }
    resultDiv.appendChild(rowsDiv);

    resultDiv.appendChild(rowsDiv);
  }

  fillTvShows(items, resultDiv) {
    let rowsDiv = document.createElement("div");
    let mediaTypeDiv = document.createElement("div");
    mediaTypeDiv.setAttribute("class", "media_type_div");
    mediaTypeDiv.innerHTML = 'TV Shows <ha-icon icon="mdi:movie"></ha-icon>';
    rowsDiv.appendChild(mediaTypeDiv);

    let tvshowsDiv = document.createElement("div");
    tvshowsDiv.setAttribute("class", "tvshows-grid");
    rowsDiv.appendChild(tvshowsDiv);

    let max = items.length;
    for (let count = 0; count < max; count++) {
      let item = items[count];
      let tvshowCardDiv = document.createElement("div");
      tvshowCardDiv.setAttribute("class", "tvshow-card");
      tvshowsDiv.appendChild(tvshowCardDiv);

      if (this._config.show_thumbnail && ["thumbnail"] != "") {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute("class", "tvshow-card-thumbnail");
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        tvshowCardDiv.appendChild(thumbnailDiv);
      }

      let playDiv = document.createElement("ha-icon");
      playDiv.setAttribute("class", "tvshow-card-play");
      playDiv.setAttribute("icon", "mdi:menu");
      playDiv.addEventListener("click", () =>
        this.searchMoreOfTvShow(item["tvshowid"])
      );
      tvshowCardDiv.appendChild(playDiv);

      let dataDiv = document.createElement("div");
      dataDiv.setAttribute("class", "tvshow-card-data");
      tvshowCardDiv.appendChild(dataDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "tvshow-card-title");
      titleDiv.innerHTML = item["title"];
      dataDiv.appendChild(titleDiv);

      let genreDiv = document.createElement("div");
      genreDiv.setAttribute("class", "tvshow-card-genre");
      genreDiv.innerHTML = item["genre"];
      dataDiv.appendChild(genreDiv);
    }
    resultDiv.appendChild(rowsDiv);
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
    return `

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
              grid-column-start: 1;
              grid-column-end: 3;
              grid-row-start: 1;
              grid-row-end: 1;
            }

            #form-btn-search{
              grid-column-start: 1;
              grid-column-end: 3;
              grid-row-start: 2;
              grid-row-end: 2;
              margin-bottom: 30px;
            }

            #form-btn-cancel{
              grid-column-start: 2;
              grid-column-end: 3;
              grid-row-start: 3;
              grid-row-end: 3;
            }
            #form-btn-recent{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 3;
              grid-row-end: 3;
            }


            .media_type_div, .result-div-noresult{
              font-weight: bold;
              font-size: 18px;
              text-align: right;
              border-bottom: solid;
            }
            /*
              -----------------
              ----- SONGS -----
              -----------------
            */
            .song-inner-item{
              display: grid;
              grid-template-columns: ${this.SONG_THUMBNAIL_MIN_SIZE} 1fr auto auto;
              grid-gap: 3px;
              grid-auto-rows: auto;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            .song-thumbnailCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 4;
              display: block;
              background-color: ${this.BACKGROUND_BASIC_COLOR};
              background-size: contain;
              background-repeat: no-repeat;
              width: ${this.SONG_THUMBNAIL_MIN_SIZE};
              height: ${this.SONG_THUMBNAIL_MIN_SIZE};
            }

            .song-thumbnailPlayCell{
              width: ${this.SONG_THUMBNAIL_MIN_SIZE};
              height: ${this.SONG_THUMBNAIL_MIN_SIZE};
            }

            .song-titleCell{
              grid-column-start: 2;
              grid-column-end: end-1;
              grid-row-start: 1;
              grid-row-end: 2;
              font-weight: bold;
              font-size: 14px;
            }

            .song-genreCell{
              grid-column-start: 2;
              grid-column-end: end-1;
              grid-row-start: 2;
              grid-row-end: 3;
              font-style: italic;
            }

            .song-albumCell{
              grid-column-start: 2;
              grid-column-end: end-1;
              grid-row-start: 3;
              grid-row-end: 4;
            }

            .song-durationCell{
              grid-column-start: 3;
              grid-column-end: end;
              grid-row-start: 3;
              grid-row-end: 4;
              text-align: right;
            }

            /*
              --------------------------------
              ----- TVSHOW SEASON DETAIL -----
              --------------------------------
            */
           .tvshow-seasondetails-inner-item{
            display: grid;
            grid-template-columns: calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO}) auto;
            grid-gap: 3px;
            grid-auto-rows: auto;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .tvshow-seasondetails-thumbnailCell{
            grid-column-start: 1;
            grid-column-end: 2;
            grid-row-start: 1;
            grid-row-end: 3;
            display: block;
            background-size: contain;
            background-repeat: no-repeat;
            width: calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO});
            height: ${this.MOVIE_THUMBNAIL_MIN_SIZE};
          }

          .tvshow-seasondetails-thumbnailPlayCell{
            grid-column-start: 1;
            grid-column-end: 2;
            grid-row-start: 1;
            grid-row-end: 3;
            display: block;
            background-size: cover;
            width: calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO});
            height: ${this.MOVIE_THUMBNAIL_MIN_SIZE};
          }

          .tvshow-seasondetails-titleCell{
            grid-column-start: 2;
            grid-column-end: 3;
            grid-row-start: 1;
            grid-row-end: 2;
            font-weight: bold;
            font-size: 18px;
          }

          .tvshow-seasondetails-episodesCell{
            grid-column-start: 2;
            grid-column-end: end;
            grid-row-start: 2;
            grid-row-end: 6;
            font-size: 12px;
          }

          .tvshow-seasondetails-episode-inner-item{
            display: grid;
            grid-template-columns: auto 25px;
            grid-gap: 3px;
            grid-auto-rows: auto;
            margin-top: 5px;
            margin-bottom: 5px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .tvshow-seasondetails-episode-titleCell{
            grid-column-start: 1;
            grid-column-end: 2;
            grid-row-start: 1;
            grid-row-end: 2;
          }

          .tvshow-seasondetails-episode-thumbnailPlayCell{
            grid-column-start: 3;
            grid-column-end: 4;
            grid-row-start: 1;
            grid-row-end: 2;
            font-size: 10px;
            text-align: right;
          }

            /*
            ------------------------
            ----- ALBUM DETAIL -----
            ------------------------
            */

            .albumdetails-inner-item{
              display: grid;
              grid-template-columns: ${this.ALBUMDETAIL_THUMBNAIL_MIN_SIZE} auto;
              grid-gap: 3px;
              grid-auto-rows: auto;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            .albumdetails-thumbnailCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 3;
              display: block;
              background-size: contain;
              background-repeat: no-repeat;
              width: ${this.ALBUMDETAIL_THUMBNAIL_MIN_SIZE};
              height: ${this.ALBUMDETAIL_THUMBNAIL_MIN_SIZE};
            }

            .albumdetails-thumbnailPlayCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 3;
              display: block;
              background-size: cover;
              width: ${this.ALBUMDETAIL_THUMBNAIL_MIN_SIZE};
              height: ${this.ALBUMDETAIL_THUMBNAIL_MIN_SIZE};
            }

            .albumdetails-titleCell{
              grid-column-start: 2;
              grid-column-end: 3;
              grid-row-start: 1;
              grid-row-end: 2;
              font-weight: bold;
              font-size: 18px;
            }

            .albumdetails-yearCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 3;
              grid-row-end: 4;
              font-size: 12px;
            }

            .albumdetails-durationCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 4;
              grid-row-end: 5;
              font-size: 12px;
              text-align: left;
            }

            .albumdetails-songsCell{
              grid-column-start: 2;
              grid-column-end: end;
              grid-row-start: 2;
              grid-row-end: 6;
              font-size: 12px;
            }

            .albumdetails-song-inner-item{
              display: grid;
              grid-template-columns: auto 25px;
              grid-gap: 3px;
              grid-auto-rows: auto;
              margin-top: 5px;
              margin-bottom: 5px;
              margin-left: 10px;
              margin-right: 10px;
            }

            .albumdetails-song-titleCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 2;
            }

            .albumdetails-song-durationCell{
              grid-column-start: 2;
              grid-column-end: 3;
              grid-row-start: 1;
              grid-row-end: 2;
            }

            .albumdetails-song-thumbnailPlayCell{
              grid-column-start: 3;
              grid-column-end: 4;
              grid-row-start: 1;
              grid-row-end: 2;
              font-size: 10px;
              text-align: right;
            }



          /*
            -------------------
            ----- RESULTS / CONTAINER-----
            -------------------
            */

          .container-grid{
            display: grid;
            grid-gap: 50px;
          }


          .result-grid{
            display: grid;
            grid-gap: 50px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }

          /*
            ------------------
            ----- ALBUMS -----
            ------------------
            */
          .albums-grid{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(${this.ALBUM_THUMBNAIL_MIN_SIZE}, 1fr));
            grid-template-rows: minmax(${this.ALBUM_THUMBNAIL_MIN_SIZE}, 1fr);
            grid-gap: 10px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .album-card{
            display: grid;
            grid-template-rows: minmax(${this.ALBUM_THUMBNAIL_MIN_SIZE}, 1fr) auto;
          }

          .album-card-thumbnail{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            background-color: ${this.BACKGROUND_BASIC_COLOR};
            display: block;
            background-size: contain;
            background-repeat: no-repeat;
            width: ${this.ALBUM_THUMBNAIL_MIN_SIZE};
            height: ${this.ALBUM_THUMBNAIL_MIN_SIZE};
          }

          .album-card-play{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            width: ${this.ALBUM_THUMBNAIL_MIN_SIZE};
            height: ${this.ALBUM_THUMBNAIL_MIN_SIZE};
          }

          .album-card-title{
            font-size: 16px;
            font-weight: bold;
            vertical-align: top;
          }

          .album-card-artist{
            font-style: italic;
          }


          /*
            -------------------
            ----- ARTISTS -----
            -------------------
            */
          .artists-grid{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(${this.ARTIST_THUMBNAIL_MIN_SIZE}, 1fr));
            grid-template-rows: minmax(${this.ARTIST_THUMBNAIL_MIN_SIZE}, 1fr);
            grid-gap: 10px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .artist-card{
            display: grid;
            grid-template-rows: minmax(${this.ARTIST_THUMBNAIL_MIN_SIZE}, 1fr) auto;
          }

          .artist-card-thumbnail{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            text-align: right;
            background-color: ${this.BACKGROUND_BASIC_COLOR};
            --mdc-icon-size: calc(${this.ARTIST_THUMBNAIL_MIN_SIZE} - 50px);
            width: ${this.ARTIST_THUMBNAIL_MIN_SIZE};
            height: ${this.ARTIST_THUMBNAIL_MIN_SIZE};
          }

          .artist-card-play{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            text-align: left;
            width: ${this.ARTIST_THUMBNAIL_MIN_SIZE};
            height: ${this.ARTIST_THUMBNAIL_MIN_SIZE};
          }

          .artist-card-title{
            font-size: 16px;
            font-weight: bold;
            vertical-align: text-top;
          }

          /*
            ------------------
            ----- MOVIES -----
            ------------------
          */
          .movies-grid{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO}), 1fr));
            grid-template-rows: minmax(${this.MOVIE_THUMBNAIL_MIN_SIZE}, 1fr);
            grid-gap: 10px;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-left: 10px;
            margin-right: 10px;
          }

          .movie-card{
            display: grid;
            grid-template-columns: minmax(calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO}), 1fr);
            grid-template-rows: minmax(${this.MOVIE_THUMBNAIL_MIN_SIZE}, 1fr) auto;
          }

          .movie-card-thumbnail{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            background-color: ${this.BACKGROUND_BASIC_COLOR};
            background-size: cover;
            background-repeat: no-repeat;
          }

          .movie-card-play{
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
          }

          .movie-card-title{
            font-size: 16px;
            font-weight: bold;
          }

          .movie-card-genre{
            font-style: italic;
          }


          /*
          --------------------
          ----- TV SHOWS -----
          --------------------
        */
        .tvshows-grid{
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO}), 1fr));
          grid-template-rows: minmax(${this.MOVIE_THUMBNAIL_MIN_SIZE}, 1fr);
          grid-gap: 10px;
          margin-top: 20px;
          margin-bottom: 20px;
          margin-left: 10px;
          margin-right: 10px;
        }

        .tvshow-card{
          display: grid;
          grid-template-columns: minmax(calc(${this.MOVIE_THUMBNAIL_MIN_SIZE} * ${this.MOVIE_THUMBNAIL_RATIO}), 1fr);
          grid-template-rows: minmax(${this.MOVIE_THUMBNAIL_MIN_SIZE}, 1fr) auto;
        }

        .tvshow-card-thumbnail{
          grid-row-start: 1;
          grid-row-end: 2;
          grid-column-start: 1;
          grid-column-end: 2;
          background-size: cover;
          background-repeat: no-repeat;
          background-color: ${this.BACKGROUND_BASIC_COLOR};
        }

        .tvshow-card-play{
          grid-row-start: 1;
          grid-row-end: 2;
          grid-column-start: 1;
          grid-column-end: 2;
        }


        .tvshow-card-title{
          font-size: 16px;
          font-weight: bold;
        }

        .tvshow-card-genre{
          font-style: italic;
        }


        .song-thumbnailPlayCell, .album-card-play, .artist-card-play, .movie-card-play, .tvshow-card-play, .albumdetails-thumbnailPlayCell, .tvshow-seasondetails-thumbnailPlayCell{
          display: block;
          color: black;
          background-color: rgb(250, 250, 250, 0.4)
        }

        .song-thumbnailPlayCell:hover, .album-card-play:hover, .artist-card-play:hover, .movie-card-play:hover, .tvshow-card-play:hover, .albumdetails-thumbnailPlayCell:hover, .albumdetails-song-thumbnailPlayCell:hover, .tvshow-seasondetails-thumbnailPlayCell:hover, .tvshow-seasondetails-episode-thumbnailPlayCell:hover{
          color: red;
        }

      `;
  }
}
customElements.define("kodi-search-card", PlaylistSearchCard);
