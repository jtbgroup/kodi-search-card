import { css } from "lit";

export const resultContainerCSS = css`
    :host {
        display: block;
    }

    .results-wrapper {
        background-color: #141414;
        padding: 0 16px 16px 16px;
    }

    .category-section {
        margin-bottom: 24px;
    }

    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--accent-color, #333);
        padding-bottom: 6px;
        margin: 16px 0 12px 0;
        color: var(--primary-text-color), #ffffff;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .category-header ha-icon {
        --mdc-icon-size: 18px;
        opacity: 0.7;
        color: var(--accent-color, #03a9f4);
    }

    .no-results-msg {
        color: #8a8a8a;
        text-align: center;
        padding: 32px;
        font-size: 0.95rem;
        background-color: #141414;
    }
`;
