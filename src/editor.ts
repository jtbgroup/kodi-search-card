import { EDITOR_SCHEMA, KodiSearchCardConfig, DEFAULT_CONFIG, EditorField } from "./types";


export class KodiSearchCardEditor {
    private _schema: EditorField[] = EDITOR_SCHEMA;
    private _config: KodiSearchCardConfig;
    private _changedFields: Set<keyof KodiSearchCardConfig> = new Set();

    constructor(config: KodiSearchCardConfig) {
        this._config = { ...config };
    }

    /**
     * Get the editor schema (field definitions)
     */
    getSchema(): EditorField[] {
        return this._schema;
    }

    /**
     * Get a specific field from the schema
     */
    getField(key: keyof KodiSearchCardConfig): EditorField | undefined {
        return this._schema.find(field => field.key === key);
    }

    /**
     * Get all fields of a specific type
     */
    getFieldsByType(type: EditorField["type"]): EditorField[] {
        return this._schema.filter(field => field.type === type);
    }

    /**
     * Get the current configuration
     */
    getConfig(): KodiSearchCardConfig {
        return { ...this._config };
    }

    /**
     * Get a specific config value
     */
    getConfigValue(key: keyof KodiSearchCardConfig): any {
        return this._config[key];
    }

    /**
     * Update a configuration value
     * Tracks changed fields for potential UI updates
     */
    setConfigValue(key: keyof KodiSearchCardConfig, value: any): void {
        const oldValue = this._config[key];

        // Only update if value actually changed
        if (oldValue !== value) {
            (this._config[key] as any) = value;
            this._changedFields.add(key);
        }
    }

    /**
     * Update multiple configuration values at once
     */
    updateConfig(updates: Partial<KodiSearchCardConfig>): void {
        Object.entries(updates).forEach(([key, value]) => {
            this.setConfigValue(key as keyof KodiSearchCardConfig, value);
        });
    }

    /**
     * Reset a field to its default value
     */
    resetField(key: keyof KodiSearchCardConfig): void {
        const field = this.getField(key);
        if (field && field.default !== undefined) {
            this.setConfigValue(key, field.default as any);
        }
    }

    /**
     * Reset all fields to defaults
     */
    resetAll(): void {
        this._config = { ...(DEFAULT_CONFIG as any) } as KodiSearchCardConfig;
        this._changedFields.clear();
    }

    /**
     * Get which fields have been changed
     */
    getChangedFields(): Array<keyof KodiSearchCardConfig> {
        return Array.from(this._changedFields);
    }

    /**
     * Clear the changed fields tracker
     */
    clearChangedFields(): void {
        this._changedFields.clear();
    }

    /**
     * Check if a field has been modified
     */
    isFieldChanged(key: keyof KodiSearchCardConfig): boolean {
        return this._changedFields.has(key);
    }

    /**
     * Validate the configuration
     * Returns an object with validation errors, or empty object if valid
     */
    validate(): Record<string, string> {
        const errors: Record<string, string> = {};

        // Validate required fields
        if (!this._config.entry_id) {
            errors.entry_id = "Entity ID is required";
        }

        //     // Validate outline_color format if provided
        //     if (this._config.outline_color) {
        //         if (!this._isValidColor(this._config.outline_color)) {
        //             errors.outline_color = "Invalid color format (use color name, rgb(), or #hex)";
        //         }
        //     }

        //     if (this._config.visible_items_count && (this._config.visible_items_count < 1)) {
        //     errors.visible_items_count = "Must be at least 1";
        // }

        // Validate height format if scrollable
        // if (this._config.items_container_scrollable && this._config.items_container_height) {
        //     if (!this._isValidDimension(this._config.items_container_height)) {
        //         errors.items_container_height = "Invalid dimension format (use px, em, rem, vh, etc.)";
        //     }
        // }

        return errors;
    }

    /**
     * Check if there are any validation errors
     */
    isValid(): boolean {
        return Object.keys(this.validate()).length === 0;
    }

    /**
     * Export configuration as YAML string (for manual editing)
     */
    toYAML(): string {
        let yaml = "type: custom:kodi-search-card\n";

        // Sort keys for readability
        const keys = Object.keys(this._config).sort() as Array<keyof KodiSearchCardConfig>;

        for (const key of keys) {
            const value = this._config[key];
            if (value !== undefined && value !== null) {
                yaml += `${String(key)}: ${this._formatYAMLValue(value)}\n`;
            }
        }

        return yaml;
    }

    /**
     * Import configuration from YAML object
     */
    fromYAML(obj: Record<string, any>): void {
        const config: Partial<KodiSearchCardConfig> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (key !== "type" && EDITOR_SCHEMA.some(f => f.key === key)) {
                config[key as keyof KodiSearchCardConfig] = value;
            }
        }

        this.updateConfig(config as KodiSearchCardConfig);
    }

    /**
     * Get configuration as JSON object
     */
    toJSON(): KodiSearchCardConfig {
        return { ...this._config };
    }

    /**
     * Import configuration from JSON object
     */
    fromJSON(obj: Partial<KodiSearchCardConfig>): void {
        this.updateConfig(obj as any);
    }

    /**
     * Helper: Check if a string is a valid CSS color
     */
    private _isValidColor(color: string): boolean {
        // Named colors, hex, rgb, rgba
        const colorRegex = /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\(.*\)|rgba\(.*\)|[a-zA-Z]+)$/;
        return colorRegex.test(color.trim());
    }

    /**
     * Helper: Format a value for YAML output
     */
    private _formatYAMLValue(value: any): string {
        if (typeof value === "string") {
            // Quote strings that contain special characters
            if (value.includes(" ") || value.includes(":") || value.includes("#")) {
                return `"${value}"`;
            }
            return value;
        }
        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }
        if (typeof value === "number") {
            return value.toString();
        }
        return JSON.stringify(value);
    }
}

/**
 * Helper function to create a new editor instance
 */
export function createEditor(config: KodiSearchCardConfig): KodiSearchCardEditor {
    return new KodiSearchCardEditor(config);
}

/**
 * Helper function to get an empty editor with defaults
 */
export function createEmptyEditor(): KodiSearchCardEditor {
    return new KodiSearchCardEditor({
        entry_id: "",
        ...(DEFAULT_CONFIG as any),
    } as KodiSearchCardConfig);
}
