
/**
 * Card configuration - All supported options
 */
export interface KodiSearchCardConfig {
    entry_id: string;
    title?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<KodiSearchCardConfig> = {
    title: "Kodi Search",

};

/**
 * Editor schema - Describes how to render the configuration UI
 * Structure prête pour l'intégration futur d'un éditeur
 */
export interface EditorField {
    key: keyof KodiSearchCardConfig;
    label: string;
    type: "text" | "number" | "boolean" | "color" | "select";
    required?: boolean;
    default?: any;
    description?: string;
    options?: Array<{ label: string; value: any }>;
    placeholder?: string;
    min?: number;
    max?: number;
}

export const EDITOR_SCHEMA: EditorField[] = [
    {
        key: "entry_id",
        label: "Entity",
        type: "text",
        required: true,
        placeholder: "sensor.kodi_media_sensor ID",
        description: "Sensor entity that provides Kodi search data",
    },
    {
        key: "title",
        label: "Card Title",
        type: "text",
        default: "Kodi Search",
        placeholder: "Kodi Search",
        description: "Title displayed at the top of the card",
    }
];



