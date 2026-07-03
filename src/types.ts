import { LovelaceCardConfig } from "custom-card-helpers";

/**
 * Résultats de recherche Kodi
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
 * Élément de résultat de recherche
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
    
    // Partie Musique existante
    songs?: SearchResultItem[];
    songid?: number | string;
    
    // Partie Vidéo / TV existante & nouvelle
    movieid?: number | string;
    tvshowid?: number | string;
    seasonid?: number | string;   
    episodeid?: number | string;
    showtitle?: string;
    
    season?: number;             
    episode?: number;             
    episodes?: SearchResultItem[]; 
    
    channelid?: number | string;
}
/**
 * Payload de l'événement item-click
 */
export interface ItemClickDetail {
    item: SearchResultItem;
    category?: string;
}

/**
 * Configuration de la carte - Toutes les options supportées
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
 * Valeurs de configuration par défaut
 */
export const DEFAULT_CONFIG: Readonly<Partial<KodiSearchCardConfig>> = {
    title: "Kodi Search",
};

/**
 * Type de champ éditeur
 */
export type EditorFieldType = "text" | "number" | "boolean" | "color" | "select";

/**
 * Option pour les champs de type select
 */
export interface EditorOption {
    label: string;
    value: string | number | boolean;
}

/**
 * Définition de champ éditeur
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