import { css } from "lit";

export const searchControlsCSS = css`
    :host {
        display: block;
    }

    .kodi-controls {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .search-box {
        display: flex;
        align-items: center;
        background: var(--secondary-background-color);
        border-radius: 8px;
        padding: 0 12px;
        height: 40px;
    }

    .search-box input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        color: var(--primary-text-color);
    }

    .control-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 8px 0;
    }

    .control-actions {
        display: flex;
        background: var(--secondary-background-color);
        border-radius: 8px;
        padding: 4px;
        gap: 4px;
    }

    .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--secondary-text-color);
        transition: all 0.2s ease;
    }

    .action-btn ha-icon {
        --mdc-icon-size: 20px;
    }

    .action-btn.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #ffffff);
    }

    .action-btn:hover:not(.active) {
        background: rgba(255, 255, 255, 0.05);
        color: var(--primary-text-color);
    }

    .navigation-icons {
        display: flex;
        gap: 8px;
    }

    .icon-btn {
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
    }

    .icon-btn:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;
