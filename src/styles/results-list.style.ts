import { css } from "lit";

export const resultListCSS = css`
    :host {
        display: block;
    }

    .results-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .list-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #252525;
        cursor: pointer;
        gap: 12px;
    }

    .list-item:last-child {
        border-bottom: none;
    }

    .list-item:hover {
        opacity: 0.8;
        background: var(--secondary-background-color);
    }

    .item-info {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }

    .item-title {
        color: var(--secondary-text-color);
        font-weight: 500;
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item-genre {
        font-style: italic;
        margin-top: 2px;
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item-subtext {
        color: #8a8a8a;
        font-size: 0.8rem;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item-duration {
        color: #8a8a8a;
        font-size: 0.8rem;
        font-family: monospace;
        margin-left: 12px;
        flex-shrink: 0;
    }
`;
