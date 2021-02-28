class PlaylistSearchCard extends HTMLElement {
  SIZE_THUMBNAIL_ALBUM = "65px";
  SIZE_THUMBNAIL_ALBUMDETAILS = "100px";

  // the height of the thumbnail
  MOVIE_THUMBNAIL_MIN_SIZE = "200px";
  MOVIE_THUMBNAIL_RATIO = 0.6;
  // the height and width of the thumbnail
  ARTIST_THUMBNAIL_MIN_SIZE = "80px";
  // the height and width of the thumbnail
  ALBUM_THUMBNAIL_MIN_SIZE = "150px";

  setConfig(config) {
    this._config = config;

    // Example configuration:
    //
    // type: custom:my-custom-card2
    // entity: light.bed_light
    //

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

      // At this point, we don't necessarily know anything about the current state
      // of anything, but we can set up the general structure of the card.
      this.playerTypeDiv = document.createElement("div");
      this.playerTypeDiv.setAttribute("class", "playerType");
      card.appendChild(this.playerTypeDiv);

      this.content = document.createElement("div");
      card.appendChild(this.content);

      // this.button = document.createElement("button");
      // this.button.addEventListener("click", () => this.buttonClicked());
      // card.appendChild(this.button);

      let style = document.createElement("style");
      style.textContent = this.defineCSS();
      this.appendChild(style);

      this.appendChild(card);
      this.setupComplete = true;
    }
  }

  defineCSS() {
    return `
           .search-form{
            }

            #search_input{
            }

            .control-buttons{
              display: grid;
              grid-template-columns: auto auto;
              grid-gap: 3px;
            }

            .search-btn{
            }

            .cancel-btn{
            }


            .media_type_div{
              font-weight: bold;
              font-size: 18px;
              text-align: right;
              border-bottom: solid;
            }

            .song-inner-item{
              display: grid;
              grid-template-columns: ${this.SIZE_THUMBNAIL_ALBUM} 1fr auto auto;
              grid-gap: 3px;
              grid-auto-rows: auto;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            .movie-inner-item{
              display: grid;
              grid-template-columns: 120px 1fr auto auto;
              grid-gap: 3px;
              grid-auto-rows: auto;
              margin-top: 20px;
              margin-bottom: 20px;
              margin-left: 10px;
              margin-right: 10px;
            }

            .titleCell{
              grid-column-start: 2;
              grid-column-end: end-1;
              grid-row-start: 1;
              grid-row-end: 2;
              font-weight: bold;
              font-size: 14px;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
            }


            .albumdetails-inner-item{
              display: grid;
              grid-template-columns: ${this.SIZE_THUMBNAIL_ALBUMDETAILS} auto;
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
              width: ${this.SIZE_THUMBNAIL_ALBUMDETAILS};
              height: ${this.SIZE_THUMBNAIL_ALBUMDETAILS};
            }

            .albumdetails-thumbnailPlayCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 3;
              background-color: rgba(255, 255, 255, .4);
              display: block;
              background-size: cover;
              width: ${this.SIZE_THUMBNAIL_ALBUMDETAILS};
              height: ${this.SIZE_THUMBNAIL_ALBUMDETAILS};
              color: BLACK;
            }

            .albumdetails-titleCell{
              grid-column-start: 2;
              grid-column-end: 3;
              grid-row-start: 1;
              grid-row-end: 2;
              font-weight: bold;
              font-size: 18px;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
            }

            .albumdetails-yearCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 3;
              grid-row-end: 4;
              //font-weight: bold;
              font-size: 12px;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
            }

            .albumdetails-durationCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 4;
              grid-row-end: 5;
              //font-weight: bold;
              font-size: 12px;
              text-align: left;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
            }

            .albumdetails-songsCell{
              grid-column-start: 2;
              grid-column-end: end;
              grid-row-start: 2;
              grid-row-end: 6;
              //font-weight: bold;
              font-size: 12px;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
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

            .song-artistCell{
              grid-column-start: 2;
              grid-column-end: end-1;
              grid-row-start: 2;
              grid-row-end: 3;
              font-size: 14px;
              // background: rgb(230,230,230);
              // background: linear-gradient(90deg, rgba(230,230,230,1) 10%, rgba(255,255,255,1) 90%);
            }


            .song-thumbnailCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 4;
              display: block;
              background-size: contain;
              background-repeat: no-repeat;
              width: ${this.SIZE_THUMBNAIL_ALBUM};
              height: ${this.SIZE_THUMBNAIL_ALBUM};
            }

            .song-thumbnailPlayCell{
              grid-column-start: 1;
              grid-column-end: 2;
              grid-row-start: 1;
              grid-row-end: 4;
              background-color: rgba(255, 255, 255, .4);
              display: block;
              background-size: cover;
              width: 65px;
              height: 65px;
              color: BLACK;
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
            background-size: cover;
            background-repeat: no-repeat;
          }

          .album-card-play{
            background-color: rgba(255, 255, 255, .4);
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            color: black;
          }

          .album-card-data{
           }

          .album-card-title{
            font-size: 16px;
            font-weight: bold;
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
            --mdc-icon-size: calc(${this.ARTIST_THUMBNAIL_MIN_SIZE} - 50px);
          }

          .artist-card-play{
            background-color: rgba(255, 255, 255, .4);
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            text-align: left;
            color: black;
          }

          .artist-card-title{
            font-size: 16px;
            font-weight: bold;
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
            background-size: cover;
            background-repeat: no-repeat;
          }

          .movie-card-play{
            background-color: rgba(255, 255, 255, .4);
            grid-row-start: 1;
            grid-row-end: 2;
            grid-column-start: 1;
            grid-column-end: 2;
            color: black;
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
        }

        .tvshow-card-play{
          background-color: rgba(255, 255, 255, .4);
          grid-row-start: 1;
          grid-row-end: 2;
          grid-column-start: 1;
          grid-column-end: 2;
          color: black;
        }


        .tvshow-card-title{
          font-size: 16px;
          font-weight: bold;
        }

        .tvshow-card-genre{
          font-style: italic;
        }



          `;
  }
  set hass(hass) {
    this._hass = hass;
    // Update the card in case anything has changed
    if (!this._config) return; // Can't assume setConfig is called before hass is set

    this._hass.callService("homeassistant", "update_entity", {
      entity_id: this._config.entity,
    });

    const entity = this._config.entity;
    let meta = hass.states[entity].attributes.meta;
    const json_meta = typeof meta == "object" ? meta : JSON.parse(meta);
    this._kodi_entity_id = json_meta[0]["kodi_entity_id"];
    this._sensor_entity_id = json_meta[0]["sensor_entity_id"];

    let data = hass.states[entity].attributes.data;
    const json = typeof data == "object" ? data : JSON.parse(data);

    // const max = json.length - 1;

    let container = document.createElement("div");
    container.setAttribute("class", "container-grid");
    container.appendChild(this.createForm());
    container.appendChild(this.createResult(json));
    this.content.appendChild(container);
  }

  createResult(json) {
    let max = json.length - 1;
    let resultDiv = document.createElement("div");
    resultDiv.setAttribute("class", "result-grid");
    resultDiv.innerHTML = "";
    for (let count = 0; count <= max; count++) {
      let typeOfItem = Object.keys(json[count])[0].toLowerCase();
      let items = json[count][typeOfItem];
      if (typeOfItem == "songs") {
        this.fillSongs(items, resultDiv);
      } else if (typeOfItem == "albums") {
        this.fillAlbums(items, resultDiv);
      } else if (typeOfItem == "artists") {
        this.fillArtists(items, resultDiv);
      } else if (typeOfItem == "movies") {
        this.fillMovies(items, resultDiv);
      } else if (typeOfItem == "tvshows") {
        this.fillTvShows(items, resultDiv);
      } else if (typeOfItem == "albumdetails") {
        this.fillAlbumDetails(items, resultDiv);
      }
    }
    return resultDiv;
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

      if (this._config.show_thumbnail) {
        let thumbnailDiv = document.createElement("div");
        thumbnailDiv.setAttribute("class", "song-thumbnailCell");
        let url = "background-image: url('" + item["thumbnail"] + "')";
        thumbnailDiv.setAttribute("style", url);
        rowDiv.appendChild(thumbnailDiv);
      }

      let thumbnailPlayDiv = document.createElement("ha-icon");
      thumbnailPlayDiv.setAttribute("class", "song-thumbnailPlayCell");
      thumbnailPlayDiv.setAttribute("icon", "mdi:play");
      thumbnailPlayDiv.addEventListener("click", () =>
        this.playSong(item["songid"])
      );
      rowDiv.appendChild(thumbnailPlayDiv);

      let titleDiv = document.createElement("div");
      titleDiv.setAttribute("class", "titleCell");
      titleDiv.innerHTML = item["title"];
      rowDiv.appendChild(titleDiv);

      let artistDiv = document.createElement("div");
      artistDiv.setAttribute("class", "song-artistCell");
      artistDiv.innerHTML = item["artist"];
      rowDiv.appendChild(artistDiv);

      songsDiv.appendChild(rowDiv);
    }
    resultDiv.appendChild(songsDiv);
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
          songsItem[idx]["track"] +
          ". " +
          songsItem[idx]["title"] +
          " (" +
          this.formatDuration(songDuration) +
          ")";
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
      durationDiv.innerHTML = this.formatDuration(albumDuration);
      rowDiv.appendChild(durationDiv);

      // let artistDiv = document.createElement("div");
      // artistDiv.setAttribute("class", "album-artistCell");
      // artistDiv.innerHTML = item["artist"];
      // rowDiv.appendChild(artistDiv);

      // albumsDiv.appendChild(rowDiv);
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

      let thumbnailDiv = document.createElement("div");
      thumbnailDiv.setAttribute("class", "album-card-thumbnail");
      let url = "background-image: url('" + item["thumbnail"] + "')";
      thumbnailDiv.setAttribute("style", url);
      albumCardDiv.appendChild(thumbnailDiv);

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

      let thumbnailDiv = document.createElement("div");
      thumbnailDiv.setAttribute("class", "movie-card-thumbnail");
      let url = "background-image: url('" + item["thumbnail"] + "')";
      thumbnailDiv.setAttribute("style", url);
      movieCardDiv.appendChild(thumbnailDiv);

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

    // let max = items.length;
    // for (let count = 0; count < max; count++) {
    //   let item = items[count];
    //   let rowDiv = document.createElement("div");
    //   rowDiv.setAttribute("class", "movie-inner-item");

    //   if (this._config.show_thumbnail) {
    //     let thumbnailDiv = document.createElement("div");
    //     thumbnailDiv.setAttribute("class", "movie-thumbnailCell");
    //     let url = "background-image: url('" + item["fanart"] + "')";
    //     thumbnailDiv.setAttribute("style", url);
    //     rowDiv.appendChild(thumbnailDiv);
    //   }

    //   let thumbnailPlayDiv = document.createElement("ha-icon");
    //   thumbnailPlayDiv.setAttribute("class", "movie-thumbnailPlayCell");
    //   thumbnailPlayDiv.setAttribute("icon", "mdi:play");
    //   thumbnailPlayDiv.addEventListener("click", () =>
    //     this.playMovie(item["movieid"])
    //   );
    //   rowDiv.appendChild(thumbnailPlayDiv);

    //   let titleDiv = document.createElement("div");
    //   titleDiv.setAttribute("class", "titleCell");
    //   titleDiv.innerHTML = item["title"];
    //   rowDiv.appendChild(titleDiv);

    //   let yearDiv = document.createElement("div");
    //   yearDiv.setAttribute("class", "song-artistCell");
    //   yearDiv.innerHTML = item["year"];
    //   rowDiv.appendChild(yearDiv);

    //   rowsDiv.appendChild(rowDiv);
    // }
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

      let thumbnailDiv = document.createElement("div");
      thumbnailDiv.setAttribute("class", "tvshow-card-thumbnail");
      let url = "background-image: url('" + item["thumbnail"] + "')";
      thumbnailDiv.setAttribute("style", url);
      tvshowCardDiv.appendChild(thumbnailDiv);

      let playDiv = document.createElement("ha-icon");
      playDiv.setAttribute("class", "tvshow-card-play");
      playDiv.setAttribute("icon", "mdi:play");
      playDiv.addEventListener("click", () => this.play(item["tvshowid"]));
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
      genreDiv.innerHTML = item["genre"] + " (" + item["year"] + ")";
      dataDiv.appendChild(genreDiv);

      let numberDiv = document.createElement("div");
      numberDiv.setAttribute("class", "tvshow-card-genre");
      numberDiv.innerHTML = item["number"];
      dataDiv.appendChild(numberDiv);
    }
    resultDiv.appendChild(rowsDiv);
  }

  createForm(max, json) {
    this.content.innerHTML = "";

    let searchFormDiv = document.createElement("div");
    searchFormDiv.setAttribute("class", "search-form");

    this.searchInput = document.createElement("paper-input");
    this.searchInput.setAttribute("label", "Type here...");
    this.searchInput.setAttribute("id", "search_input");
    this.searchInput.addEventListener("keydown", (event) => {
      if (event.code === "Enter") {
        this.search();
      }
    });
    searchFormDiv.appendChild(this.searchInput);

    let controlsDiv = document.createElement("div");
    controlsDiv.setAttribute("class", "control-buttons");
    searchFormDiv.appendChild(controlsDiv);

    let searchButton = document.createElement("mwc-button");
    // searchButton.setAttribute("icon", "mdi:magnify");
    searchButton.innerHTML = "Search";
    searchButton.setAttribute("class", "search-btn");
    searchButton.setAttribute("raised", "");
    searchButton.addEventListener("click", () => this.search());
    controlsDiv.appendChild(searchButton);

    let cancelButton = document.createElement("mwc-button");
    // cancelButton.setAttribute("icon", "mdi:delete");
    cancelButton.setAttribute("class", "cancel-btn");
    cancelButton.setAttribute("raised", "");
    cancelButton.innerHTML = "Clear";
    cancelButton.addEventListener("click", () => this.clear());
    controlsDiv.appendChild(cancelButton);

    // this.content.appendChild(searchFormDiv);
    return searchFormDiv;
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
    this._hass.callService("kodi_media_sensors", "call_method", {
      entity_id: this._sensor_entity_id,
      method: "clear",
    });
  }
  search() {
    let searchText = this.searchInput.value;
    this._hass.callService("kodi_media_sensors", "call_method", {
      entity_id: this._sensor_entity_id,
      method: "search",
      item: {
        media_type: "all",
        value: searchText,
      },
    });
    this._hass.callService("homeassistant", "update_entity", {
      entity_id: this._config.entity,
    });
  }

  searchMoreOfArtist(artist_id) {
    let searchText = this.searchInput.value;
    this._hass.callService("kodi_media_sensors", "call_method", {
      entity_id: this._sensor_entity_id,
      method: "search",
      item: {
        media_type: "artist",
        value: artist_id,
      },
    });
    this._hass.callService("homeassistant", "update_entity", {
      entity_id: this._config.entity,
    });
  }

  playSong(song_id) {
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Playlist.Insert",
      playlistid: 0,
      position: 1,
      item: { songid: song_id },
    });
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Player.Open",
      item: { playlistid: 0, position: 1 },
    });
  }

  playAlbum(album_id) {
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Playlist.Insert",
      playlistid: 0,
      position: 1,
      item: { albumid: album_id },
    });
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Player.Open",
      item: { playlistid: 0, position: 1 },
    });
  }

  playMovie(movie_id) {
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Playlist.Insert",
      playlistid: 1,
      position: 1,
      item: { movieid: movie_id },
    });
    this._hass.callService("kodi", "call_method", {
      entity_id: this._kodi_entity_id,
      method: "Player.Open",
      item: { playlistid: 1, position: 1 },
    });
  }

  getCardSize() {
    // let view = this.config.image_style || "poster";
    // return view == "poster" ? window.cardSize * 5 : window.cardSize * 3;
    return 1;
  }
}
customElements.define("kodi-search-card", PlaylistSearchCard);
