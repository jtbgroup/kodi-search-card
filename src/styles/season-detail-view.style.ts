import { css } from "lit";

export const seasonDetailCSS = css`
    :host {
        display: block;
    }

    .tvshow-detailed-view {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .season-detailed-row {
        display: flex;
        gap: 20px;
        background: #1c1c1c;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid #2d2d2d;
    }

    @media (max-width: 600px) {
        .season-detailed-row {
            flex-direction: column;
        }
    }

    .season-detailed-thumb-container {
        width: 120px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    /* Vertical display format (2/3) for series/seasons. */
    .season-detailed-thumb-container kodi-item-thumbnail {
        width: 110px;
        height: 155px;
        margin-bottom: 8px;
        --thumb-ratio: 2/3;
    }

    .season-detailed-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: #fff;
        line-height: 1.2;
    }

    .season-detailed-episodes-list {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .episode-item {
        display: flex;
        align-items: center;
        padding: 3px 5px;
        border-radius: 4px;
        transition: background 0.2s;
        border-bottom: 1px solid #252525;
    }

    .episode-item:hover {
        background: #2a2a2a;
    }

    .episode-title {
        flex-grow: 1;
        color: #ffffff;
        font-size: 0.9rem;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .episode-actions {
        display: flex;
        gap: 4px;
    }

    .episode-actions ha-icon {
        --mdc-icon-size: 20px;
        padding: 4px;
        cursor: pointer;
    }

    .no-episodes-msg {
        color: #8a8a8a;
        font-style: italic;
        padding: 12px;
        font-size: 0.85rem;
    }
`;
