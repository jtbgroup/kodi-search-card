import { css } from "lit";

export const resultGridCSS = css`
    :host {
        display: block;
    }

    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 16px;
        padding-top: 4px;
    }

    .grid-card {
        display: flex;
        flex-direction: column;
        cursor: pointer;
    }

    .grid-card:hover {
        opacity: 0.8;
    }

    .grid-title {
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 500;
        line-height: 1.2;
        max-height: 2.4em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin-top: 8px;
    }

    .grid-meta {
        color: #8a8a8a;
        font-size: 0.75rem;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;
