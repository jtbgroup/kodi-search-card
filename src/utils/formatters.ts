// src/utils/formatters.ts
import { CategoryHelper } from "../services/category-helper";
import { SearchResultItem } from "../types";

export function formatDuration(seconds: number | undefined): string {
    if (!seconds || isNaN(seconds)) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function buildMetadataString(item: SearchResultItem, category: string): string {
    const itemType = category;

    if (itemType === CategoryHelper.CATEGORY_SONGS || itemType === "musics") {
        const parts: string[] = [];

        if (item.year) {
            parts.push(`(${item.year})`);
        }
        if (item.artist) {
            parts.push(Array.isArray(item.artist) ? item.artist.join(", ") : item.artist);
        }
        if (item.album) {
            parts.push(item.album);
        }
        return parts.length > 0 ? parts.join(" • ") : category;
    }

    if (itemType === CategoryHelper.CATEGORY_EPISODES) {
        const showtitle = item.showtitle;
        const season = item.season ?? "?";
        const episode = item.episode ?? "?";
        return `${showtitle} (S${season}:E${episode})`;
    }

    if (itemType === CategoryHelper.CATEGORY_ALBUMS) {
        if (item.artist) {
            return Array.isArray(item.artist) ? item.artist.join(", ") : item.artist;
        }
        return "";
    }
    if (itemType === CategoryHelper.CATEGORY_MOVIES) {
        if (item.genre) {
            return `${item.genre}`;
        }
        return "";
    }

    return "";
}

export function formatGenre(genre: string | string[] | undefined): string {
    if (!genre) return "";
    if (Array.isArray(genre)) {
        return genre.length > 0 ? genre.join(", ") : "";
    }
    return genre;
}

export function getItemIcon(item: SearchResultItem): string {
    const itemType = item.type;

    if (itemType === CategoryHelper.CATEGORY_SONGS || itemType === "music") {
        return "mdi:music";
    }
    if (itemType === CategoryHelper.CATEGORY_MOVIES) {
        return "mdi:movie";
    }
    if (itemType === CategoryHelper.CATEGORY_EPISODES) {
        return "mdi:television";
    }
    return "mdi:play";
}

  export function convertOutlineColor(color: string): string {
        if (!color) return "var(--divider-color)";

        if (Array.isArray(color)) {
            const newColor = `rgb(${color.join(",")})`;
            console.log("Converted array color to:", newColor);
            return newColor;
        }
        return color;
    }

