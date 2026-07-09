import { css } from "lit";

export const kodiSearchCardCSS = css`
    :host {
        display: block;
        background: var(--ha-card-background, var(--card-background-color, #ffffff));
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--divider-color);
        overflow: hidden;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
    }

    .card-title {
        margin: 0;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .kodi-icon {
        color: var(--accent-color);
    }

    @keyframes pulse-dot {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.3;
        }
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        transition: background 0.3s ease;
    }

    .status-dot.fixed-green {
        background: var(--success-color);
    }

    .status-dot.fixed-orange {
        background: var(--warning-color);
    }

    .status-dot.fixed-red {
        background: var(--error-color);
    }

    .status-dot.flashing-green {
        background: var(--success-color);
        animation: pulse-dot 1s infinite;
    }

    .search-content {
        background-color: #141414;
    }
    .version-footer {
        text-align: right;
        font-size: 0.7em;
        color: var(--secondary-text-color);
        padding: 8px;
        opacity: 0.6;
    }
`;

