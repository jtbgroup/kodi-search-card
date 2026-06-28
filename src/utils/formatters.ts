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
        // const showTitle = item.showtitle || "Unknown Show";
        // const season = item.season ?? "?";
        // const episode = item.episode ?? "?";
        // return `${showTitle} • S${season}E${episode}`;
        return "check formatters. not implemented";
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

    if (itemType === "song" || itemType === "music") {
        return "mdi:music";
    }
    if (itemType === "movie") {
        return "mdi:movie";
    }
    if (itemType === "episode") {
        return "mdi:television";
    }
    return "mdi:play";
}
