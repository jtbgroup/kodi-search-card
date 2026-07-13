// src/utils/formatters.ts
import {
    CATEGORY_ALBUMS,
    CATEGORY_ARTISTS,
    CATEGORY_EPISODES,
    CATEGORY_MOVIES,
    CATEGORY_MUSICVIDEOS,
    CATEGORY_SONGS,
    CATEGORY_TVSHOWS,
    CATEGORY_CHANNELS,
} from "../const";
import { SearchResultItem } from "../types";

export function formatDuration(seconds: number | undefined): string {
    if (!seconds || isNaN(seconds)) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function buildMetadataString(item: SearchResultItem, category: string): string {
    const itemType = category;

    if (itemType === CATEGORY_SONGS || itemType === "musics") {
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

    if (itemType === CATEGORY_EPISODES) {
        const showtitle = item.showtitle;
        const season = item.season ?? "?";
        const episode = item.episode ?? "?";
        return `${showtitle} (S${season}:E${episode})`;
    }

    if (itemType === CATEGORY_ALBUMS || itemType === CATEGORY_MUSICVIDEOS) {
        if (item.artist) {
            return Array.isArray(item.artist) ? item.artist.join(", ") : item.artist;
        }
        return "";
    }
    if (itemType === CATEGORY_MOVIES) {
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

export function convertOutlineColor(color: string): string {
    if (!color) return "var(--divider-color)";

    if (Array.isArray(color)) {
        const newColor = `rgb(${color.join(",")})`;
        return newColor;
    }
    return color;
}

export function getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
        case CATEGORY_SONGS:
            return "mdi:music";
        case CATEGORY_ALBUMS:
            return "mdi:album";
        case CATEGORY_ARTISTS:
            return "mdi:account-music";
        case CATEGORY_MOVIES:
        case CATEGORY_EPISODES:
            return "mdi:movie-open";
        case CATEGORY_TVSHOWS:
            return "mdi:television-classic";
        case CATEGORY_MUSICVIDEOS:
            return "mdi:video-box";
        default:
            return "mdi:play-circle";
    }
}

export function getThumbnailAspectRatio(category: string): string {
    switch (category.toLowerCase()) {
        case CATEGORY_MOVIES:
        case CATEGORY_TVSHOWS:
            return "2/3";
        case CATEGORY_EPISODES:
        case CATEGORY_MUSICVIDEOS:
            return "16/9";
        default:
            return "1/1";
    }
}

export function getActionIcon(category: string, searchAction: "play" | "add"): string {
    const categoriesToNavigate = ["tvshows", "artists"];
    if (categoriesToNavigate.includes(category.toLowerCase())) {
        return "mdi:menu";
    }
    return searchAction === "play" ? "mdi:play" : "mdi:plus";
}

export function isGridLayout(category: string): boolean {
    return [
        CATEGORY_ALBUMS,
        CATEGORY_ARTISTS,
        CATEGORY_MOVIES,
        CATEGORY_MUSICVIDEOS,
        CATEGORY_TVSHOWS,
        CATEGORY_EPISODES,
        CATEGORY_CHANNELS,
    ].includes(category.toLowerCase());
}

export function isContainerCategory(category: string): boolean {
    return [CATEGORY_TVSHOWS, CATEGORY_ARTISTS].includes(category.toLowerCase());
}

