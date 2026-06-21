import { LovelaceCardConfig } from "custom-card-helpers";

/**
 * Card configuration - All supported options
 */
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
    show_recently_added?: boolean;
    show_recently_played?: boolean;
    show_current_artist?: boolean;
    title?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Readonly<Partial<KodiSearchCardConfig>> = {
    title: "Kodi Search",
};

/**
 * Editor field type definition
 */
export type EditorFieldType = "text" | "number" | "boolean" | "color" | "select";

/**
 * Option for select type fields
 */
export interface EditorOption {
    label: string;
    value: string | number | boolean;
}

/**
 * Editor schema field definition
 */
export interface EditorField {
    key: keyof KodiSearchCardConfig;
    label: string;
    type: EditorFieldType;
    required?: boolean;
    default?: string | number | boolean;
    description?: string;
    options?: EditorOption[];
    placeholder?: string;
    min?: number;
    max?: number;
}

