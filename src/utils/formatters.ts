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
    CATEGORY_MUSICPLAYLISTS,
    MUSIC_PLAYLIST_EXTENSIONS_ALLOWED,
    ACTION_MAP,
} from "../const";
import { SearchActionType, SearchResultItem } from "../types";

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
        case CATEGORY_MUSICPLAYLISTS:
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

function getFileExtension(filePath?: string): string {
    if (!filePath) {
        return "";
    }

    const normalized = filePath.toLowerCase();
    const lastDot = normalized.lastIndexOf(".");
    if (lastDot === -1) {
        return "";
    }

    return normalized.slice(lastDot);
}

export function getMusicPlaylistItemKind(item: SearchResultItem): "playable" | "directory" | "blocked" {
    const filePath = item.file || item.label || "";
    const extension = getFileExtension(filePath);
    const fileType = String(item.filetype || item.type || "").toLowerCase();
    const isDirectory = fileType === "directory" || filePath.endsWith("/");
    const isKnownExtension = MUSIC_PLAYLIST_EXTENSIONS_ALLOWED.includes(extension);

    if (isDirectory && !extension) {
        return "directory";
    }

    if (isKnownExtension) {
        return "playable";
    }

    return "blocked";
}

export function getItemPresentation(
    item: SearchResultItem,
    category: string,
    searchAction: SearchActionType,
): {
    icon: string;
    actionIcon: string;
    isContainer: boolean;
    isActionDisabled: boolean;
} {
    const categoryLower = category.toLowerCase();
    const defaultActionIcon = ACTION_MAP[searchAction].icon;

    if (categoryLower === CATEGORY_MUSICPLAYLISTS) {
        const itemKind = getMusicPlaylistItemKind(item);

        if (itemKind === "directory") {
            return {
                icon: "mdi:folder",
                actionIcon: "mdi:information",
                isContainer: true,
                isActionDisabled: false,
            };
        }

        if (itemKind === "blocked") {
            return {
                icon: "mdi:music",
                actionIcon: "mdi:stop",
                isContainer: false,
                isActionDisabled: true,
            };
        }

        return {
            icon: "mdi:music",
            actionIcon: defaultActionIcon,
            isContainer: false,
            isActionDisabled: false,
        };
    }

    if (["tvshows", "artists"].includes(categoryLower)) {
        return {
            icon: getCategoryIcon(category),
            actionIcon: "mdi:information",
            isContainer: true,
            isActionDisabled: false,
        };
    }

    return {
        icon: getCategoryIcon(category),
        actionIcon: defaultActionIcon,
        isContainer: false,
        isActionDisabled: false,
    };
}

export function getActionIcon(category: string, searchAction: SearchActionType): string {
    const categoriesToNavigate = ["tvshows", "artists"];
    if (categoriesToNavigate.includes(category.toLowerCase())) {
        return "mdi:menu";
    }
    return ACTION_MAP[searchAction].icon;
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

