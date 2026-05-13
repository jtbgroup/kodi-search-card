import { css } from "lit";

export const formStyles = css`
    #search-form-controls-grid {
        display: grid;
        row-gap: 10px;
        grid-template-columns: auto;
    }

    .search-form-controls-fields-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .search-field-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .field-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-left: 4px;
    }

    input.search-input,
    select.search-input {
        width: 100%;
        height: 44px;
        box-sizing: border-box;
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        padding: 0 12px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
    }

    input.search-input:focus,
    select.search-input:focus {
        border: 2px solid var(--primary-color);
    }

    select.search-input {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px;
    }

    ha-button {
        margin: 5px;
    }

    .search-form-controls-buttons-optional-grid ha-button::part(base) {
        background-color: var(--info-color);
        color: var(--text-primary-color, white);
    }

    .search-form-controls-buttons-optional-grid ha-button::part(base):hover {
        background-color: color-mix(in srgb, var(--info-color) 80%, black);
        color: var(--text-primary-color, white);
    }
`;

