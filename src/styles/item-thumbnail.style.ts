import { css } from "lit";

export const itemThumbnailCSS = css`
    :host {
        display: contents;
    }

    .thumb-wrapper {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--secondary-background-color);
        aspect-ratio: var(--thumb-ratio, 1/1);
    }

    .thumb-wrapper.with-border {
        border: 1px solid var(--outline-color);
    }

    :host([size="large"]) .thumb-wrapper {
        width: 100%;
    }

    :host([size="small"]) .thumb-wrapper {
        width: 60px;
        height: 60px;
        flex-shrink: 0;
    }

    .thumb-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--secondary-background-color);
    }

    .thumb-placeholder.is-container {
        background-color: var(--secondary-background-color);
        opacity: 0.8;
        position: relative;
    }

    .thumb-placeholder.is-container ha-icon {
        position: absolute;
        bottom: 8px;
        right: 8px;
    }

    .thumb-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        color: #ffffff !important; /* Force l'icône en blanc */
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none; /* Laisse passer le clic vers la carte */
        z-index: 2; /* Passe au-dessus de l'image ou du placeholder */
    }

    .thumb-wrapper:hover .thumb-overlay {
        opacity: 1;
    }

    :host([size="large"]) .thumb-overlay ha-icon {
        --mdc-icon-size: 40px;
    }

    :host([size="small"]) .thumb-overlay ha-icon {
        --mdc-icon-size: 24px;
    }
`;
