import { css } from "lit";

export const songsStyles = css`
    .search-songs-grid {
        grid-template-columns: auto;
        grid-template-rows: auto;
    }

    .search-song-grid {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-auto-rows: auto;
        column-gap: 10px;
    }

    .search-song-title {
        grid-column: 2 / 4;
        grid-row: 1;
    }

    .search-song-genre {
        grid-column: 2 / 4;
        grid-row: 2;
    }

    .search-song-album {
        grid-column: 2 / 3;
        grid-row: 3;
    }

    .search-song-duration {
        grid-column: 3 / 4;
        grid-row: 3;
        text-align: right;
    }

    .search-song-cover {
        grid-column: 1;
        grid-row: 1 / 5;
        width: var(--song-thumbnail-width);
        height: var(--song-thumbnail-width);
    }

    .search-song-cover-image-default {
        --mdc-icon-size: calc(var(--song-thumbnail-width) - 30px);
    }
`;

export const albumsStyles = css`
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

    .search-album-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--album-thumbnail-width);
        height: var(--album-thumbnail-width);
    }

    .search-album-cover-image-default {
        --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
    }
`;

export const artistsStyles = css`
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
        width: var(--artist-thumbnail-width);
        height: var(--artist-thumbnail-width);
    }

    .search-artist-cover-image-default {
        --mdc-icon-size: calc(var(--artist-thumbnail-width) - 30px);
    }
`;

export const moviesStyles = css`
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

    .search-movie-title {
        grid-column: 1 / 3;
        grid-row: 2;
    }

    .search-movie-genre {
        grid-column: 1 / 3;
        grid-row: 3;
    }

    .search-movie-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--movie-thumbnail-width);
        height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
    }

    .search-movie-cover-image-default {
        --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
    }
`;

export const musicvideosStyles = css`
    .search-musicvideos-grid {
        grid-template-columns: repeat(auto-fill, minmax(var(--musicvideo-thumbnail-width), 1fr));
        grid-template-rows: auto;
    }

    .search-musicvideo-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto 1fr;
        row-gap: 3px;
    }

    .search-musicvideo-artist {
        grid-column: 1 / 3;
        grid-row: 2;
    }

    .search-musicvideo-title {
        grid-column: 1 / 3;
        grid-row: 3;
    }

    .search-musicvideo-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--musicvideo-thumbnail-width);
        height: calc(var(--musicvideo-thumbnail-width) / var(--musicvideo-thumbnail-ratio));
    }

    .search-musicvideo-cover-image-default {
        --mdc-icon-size: calc(var(--musicvideo-thumbnail-width) - 30px);
    }
`;

export const tvshowsStyles = css`
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

    .search-tvshow-title {
        grid-column: 1 / 3;
        grid-row: 2;
    }

    .search-tvshow-genre {
        grid-column: 1 / 3;
        grid-row: 3;
    }

    .search-tvshow-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--movie-thumbnail-width);
        height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
    }

    .search-tvshow-cover-image-default {
        --mdc-icon-size: calc(var(--movie-thumbnail-width) - 30px);
    }
`;

export const episodesStyles = css`
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

    .search-episode-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--episode-thumbnail-width);
        height: calc(var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio));
    }

    .search-episode-cover-image-default {
        --mdc-icon-size: calc((var(--episode-thumbnail-width) / var(--episode-thumbnail-ratio)) - 30px);
    }
`;

export const channelsStyles = css`
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

    .search-channel-title {
        grid-column: 1 / 3;
        grid-row: 2;
    }

    .search-channel-type {
        grid-column: 1 / 3;
        grid-row: 3;
    }

    .search-channels-channeltype {
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        padding-top: 20px;
        text-decoration: underline overline;
    }

    .search-channel-cover {
        grid-column: 1 / 2;
        grid-row: 1;
        width: var(--movie-thumbnail-width);
        height: calc(var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio));
    }

    .search-channel-cover-image-default {
        --mdc-icon-size: calc((var(--movie-thumbnail-width) / var(--movie-thumbnail-ratio)) - 30px);
    }
`;

export const albumdetailStyles = css`
    .search-albumsdetails-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
    }

    .search-albumdetails-grid {
        grid-template-columns: auto 1fr;
        grid-auto-rows: auto;
        border-bottom: solid;
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
        margin: 5px 10px;
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
        cursor: pointer;
    }

    .search-albumdetails-cover {
        grid-column: 1;
        grid-row: 1;
        width: var(--album-thumbnail-width);
        height: var(--album-thumbnail-width);
    }

    .search-albumdetails-cover-image-default {
        --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
    }

    .highlighted {
        font-weight: bold;
    }
`;

export const seasondetailStyles = css`
    .search-seasondetails-grid {
        grid-template-columns: auto 1fr;
        grid-auto-rows: auto;
        border-bottom: solid;
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
        margin: 5px 10px;
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
        cursor: pointer;
    }

    .search-seasondetails-cover {
        grid-column: 1;
        grid-row: 1;
        width: var(--album-thumbnail-width);
        height: calc(var(--album-thumbnail-width) / var(--movie-thumbnail-ratio));
    }

    .search-seasondetails-cover-image-default {
        --mdc-icon-size: calc(var(--album-thumbnail-width) - 30px);
    }

    .highlighted {
        font-weight: bold;
    }
`;

export const filemusicplaylistStyles = css`
    .search-filemusicplaylists-grid {
        grid-template-columns: auto;
        grid-template-rows: auto;
    }

    .search-filemusicplaylist-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-auto-rows: auto;
        column-gap: 10px;
    }

    .search-filemusicplaylist-cover {
        grid-column: 1;
        grid-row: 1 / 3;
        width: var(--song-thumbnail-width);
        height: var(--song-thumbnail-width);
    }

    .search-filemusicplaylist-cover-image-default {
        --mdc-icon-size: calc(var(--song-thumbnail-width) - 30px);
    }

    .search-filemusicplaylist-label {
        grid-column: 2;
        grid-row: 1;
    }

    .search-filemusicplaylist-title {
        grid-column: 2;
        grid-row: 2;
    }
`;
