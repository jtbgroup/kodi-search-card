import { SearchResultItem } from "../types";

export class CategoryHelper {

    static CATEGORY_MOVIES = "movies";
    static CATEGORY_SONGS = "songs";
    static CATEGORY_MUSICVIDEOS = "musicvideos";
    static CATEGORY_ARTISTS = "artists";
    static CATEGORY_ALBUMS="albums";
    static CATEGORY_EPISODES="episodes";
    static CATEGORY_TVSHOWS = "tvshows";

    

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

    static getThumbnailAspectRatio(category: string): string {
        switch (category.toLowerCase()) {
            case "movies":
                return "2/3";
            default:
                return "1/1";
        }
    }

    static getActionIcon(category: string, searchAction: "play" | "add"): string {
        const categoriesToNavigate = ["tvshows", "artists"];
        if (categoriesToNavigate.includes(category.toLowerCase())) {
            return "mdi:menu";
        }
        return searchAction === "play" ? "mdi:play" : "mdi:plus";
    }

    static isGridLayout(category: string): boolean {
        return ["albums", "artists", "movies"].includes(category.toLowerCase());
    }

    static isContainerCategory(category: string): boolean {
        return ["tvshows", "artists"].includes(category.toLowerCase());
    }
}

