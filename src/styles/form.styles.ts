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

    input.search-input {
        width: 100%;
        height: 44px;
        box-sizing: border-box;
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        padding: 0 12px;
        font-size: 14px;
        outline: none;
        appearance: none;
    }

    input.search-input:focus {
        border: 2px solid var(--primary-color);
    }

    ha-select {
        display: block;
        width: 100%;
    }

    ha-button {
        margin: 5px;
    }
`;
