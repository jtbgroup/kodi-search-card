import { LovelaceCardConfig } from "custom-card-helpers";

/**
 * Kodi search results.
 */
export interface SearchResults {
    movies?: SearchResultItem[];
    tvshows?: SearchResultItem[];
    seasons?: SearchResultItem[];
    songs?: SearchResultItem[];
    albums?: SearchResultItem[];
    artists?: SearchResultItem[];
    musicvideos?: SearchResultItem[];
    channels?: SearchResultItem[];
    episodes?: SearchResultItem[];
    filemusicplaylist?: SearchResultItem[];
    [key: string]: SearchResultItem[] | undefined;
}

/**
 * Search result item.
 */
export interface SearchResultItem {
    title?: string;
    name?: string;
    label?: string;
    type?: string;  
    artist?: string | string[];
    artistid?: number | string;
    album?: string;
    albumid?: number | string;
    albumartist?: string | string[];
    thumbnail?: string;
    poster?: string;
    fanart?: string;
    year?: number | string;
    rating?: number;
    duration?: number;
    genre?: string | string[];
    file?: string;
    
    // Existing music section.
    songs?: SearchResultItem[];
    songid?: number | string;
    
    // Existing and new video/TV section.
    movieid?: number | string;
    tvshowid?: number | string;
    seasonid?: number | string;   
    episodeid?: number | string;
    showtitle?: string;
    musicvideoid?: number | string;
    
    season?: number;             
    episode?: number;             
    episodes?: SearchResultItem[]; 
    
    channelid?: number | string;
}
/**
 * Payload for the item-click event.
 */
export interface ItemClickDetail {
    item: SearchResultItem;
    category?: string;
}

/**
 * Card configuration - all supported options.
 */
export interface KodiSearchCardConfig extends LovelaceCardConfig {
    action_mode?: "play" | "add";
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
 * Default configuration values.
 */
export const DEFAULT_CONFIG: Readonly<Partial<KodiSearchCardConfig>> = {
    title: "Kodi Search",
};

/**
 * Editor field type.
 */
export type EditorFieldType = "text" | "number" | "boolean" | "color" | "select";

/**
 * Option for select-type fields.
 */
export interface EditorOption {
    label: string;
    value: string | number | boolean;
}

/**
 * Editor field definition.
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