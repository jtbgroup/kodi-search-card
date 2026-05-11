import { css } from "lit";

export const sharedStyles = css`
    :host {
        --album-thumbnail-width: 130px;
        --song-thumbnail-width: 65px;
        --movie-thumbnail-width: 150px;
        --movie-thumbnail-ratio: 0.8;
        --musicvideo-thumbnail-width: 120px;
        --musicvideo-thumbnail-ratio: 1;
        --channel-thumbnail-width: 180px;
        --channel-thumbnail-ratio: 1.5;
        --artist-thumbnail-width: 130px;
        --episode-thumbnail-width: 180px;
        --episode-thumbnail-ratio: 1.5;
        --background-basic-color: #9b9595;
        --container-rows-gap: 10px;
        --container-main-rows-gap: 30px;
        --mdc-select-fill-color: rgba(0, 0, 0, 0);
    }

    .media-type-div,
    .result-div-noresult {
        font-weight: bold;
        font-size: 18px;
        text-align: right;
        border-bottom: solid;
    }

    .cover-image-outline-border {
        border: 1px solid var(--outline_color);
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
`;
