import { SearchResultItem } from "../types";

export class CategoryHelper {
    static getCategoryIcon(category: string): string {
        switch (category.toLowerCase()) {
            case "songs":
                return "mdi:music";
            case "albums":
                return "mdi:album";
            case "artists":
                return "mdi:account-music";
            case "movies":
                return "mdi:movie-open";
            case "tvshows":
                return "mdi:television-classic";
            case "musicvideos":
                return "mdi:video-music";
            default:
                return "mdi:play-circle";
        }
    }

    static getActionIcon(category: string, searchAction: "play" | "add"): string {
        const categoriesToNavigate = ["tvshows", "artists"];
        if (categoriesToNavigate.includes(category.toLowerCase())) {
            return "mdi:menu";
        }
        return searchAction === "play" ? "mdi:play" : "mdi:plus";
    }
    

    static getMetaLine(item: SearchResultItem, category: string): string {
        const parts: string[] = [];

        if (item.artist) {
            parts.push(Array.isArray(item.artist) ? item.artist.join(", ") : item.artist);
        }
        if (item.album) {
            parts.push(item.album);
        }
        if (item.year) {
            parts.push(`(${item.year})`);
        }

        return parts.length > 0 ? parts.join(" • ") : category;
    }

    static formatDuration(seconds: number | undefined): string {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    static isGridLayout(category: string): boolean {
        return ["albums", "artists"].includes(category.toLowerCase());
    }

    static isContainerCategory(category: string): boolean {
        return ["tvshows", "artists"].includes(category.toLowerCase());
    }
}
