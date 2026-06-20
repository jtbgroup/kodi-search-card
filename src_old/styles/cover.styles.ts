import { css } from "lit";

export const coverStyles = css`
    .overlay-play {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        color: white;
        transition: 0.5s ease opacity;
        text-align: center;
        --mdc-icon-size: 50px;
    }

    .search-item-cover-image-default {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        color: white;
        height: 100%;
    }

    .search-item-cover-container {
        position: relative;
        background-color: var(--background-basic-color, #9b9595);
    }

    .search-item-cover-image {
        position: absolute;
    }

    .search-item-cover-image,
    .search-item-cover-container {
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    .search-item-cover {
        position: relative;
    }

    .search-item-cover:hover .overlay-play {
        opacity: 1;
    }

    .cover-image-outline-border {
        border: 1px solid var(--outline_color);
    }
`;
