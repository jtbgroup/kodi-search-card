import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from "custom-card-helpers";

declare global {
    interface HTMLElementTagNameMap {
        "kodi-search-card-editor": LovelaceCardEditor;
        "hui-error-card": LovelaceCard;
    }
}

// TODO Add your configuration elements here for type-checking
export interface KodiSearchCardConfig extends LovelaceCardConfig {
    action_mode?: string;
    add_position?: number;
    album_details_sort?: string;
    entity: string;
    media_type_order?: string[];
    outline_color?: string;
    show_thumbnail?: boolean;
    show_thumbnail_overlay?: boolean;
    show_thumbnail_border?: boolean;
    show_action_mode?: boolean;
    title?: string;
}

