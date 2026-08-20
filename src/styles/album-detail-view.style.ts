import { css } from "lit";

export const albumDetailViewCSS = css`
    :host {
        display: block;
    }

    .artist-detailed-view {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .album-detailed-row {
        display: flex;
        gap: 20px;
        background: #1c1c1c;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid #2d2d2d;
    }

    @media (max-width: 600px) {
        .album-detailed-row {
            flex-direction: column;
        }
    }

    .album-detailed-thumb-container {
        width: 120px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .album-detailed-thumb-container kodi-item-thumbnail {
        width: 100px;
        height: 100px;
        margin-bottom: 8px;
    }

    .album-detailed-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: #fff;
        line-height: 1.2;
    }

    .album-detailed-year {
        font-size: 0.8rem;
        color: #8a8a8a;
        margin-top: 2px;
    }

    .album-detailed-songs-list {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .album-song-item {
        display: flex;
        align-items: center;
        padding: 3px 5px;
        border-radius: 4px;
        transition: background 0.2s;
        border-bottom: 1px solid #252525;
    }

    .album-song-item:hover {
        background: #2a2a2a;
    }

    .song-index {
        color: #8a8a8a;
        margin-right: 8px;
        width: 20px;
        font-size: 0.85rem;
    }

    .song-title {
        flex-grow: 1;
        color: #ffffff;
        font-size: 0.9rem;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-duration {
        color: #8a8a8a;
        font-size: 0.8rem;
        margin-right: 12px;
        font-family: monospace;
    }

    .song-actions {
        display: flex;
        gap: 4px;
    }

    .song-actions ha-icon {
        --mdc-icon-size: 20px;
        padding: 4px;
        cursor: pointer;
    }

    .no-songs-msg {
        color: #8a8a8a;
        font-style: italic;
        padding: 12px;
        font-size: 0.85rem;
    }
`;
