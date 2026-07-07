import { SearchResultItem } from "../types";

export class CategoryHelper {
    static CATEGORY_MOVIES = "movies";
    static CATEGORY_SONGS = "songs";
    static CATEGORY_MUSICVIDEOS = "musicvideos";
    static CATEGORY_ARTISTS = "artists";
    static CATEGORY_ALBUMS = "albums";
    static CATEGORY_EPISODES = "episodes";
    static CATEGORY_SEASONS = "seasons";
    static CATEGORY_TVSHOWS = "tvshows";

    static getCategoryIcon(category: string): string {
        switch (category.toLowerCase()) {
            case CategoryHelper.CATEGORY_SONGS:
                return "mdi:music";
            case CategoryHelper.CATEGORY_ALBUMS:
                return "mdi:album";
            case CategoryHelper.CATEGORY_ARTISTS:
                return "mdi:account-music";
            case CategoryHelper.CATEGORY_MOVIES:
            case CategoryHelper.CATEGORY_EPISODES:
                return "mdi:movie-open";
            case CategoryHelper.CATEGORY_TVSHOWS:
                return "mdi:television-classic";
            case CategoryHelper.CATEGORY_MUSICVIDEOS:
                return "mdi:video-box";
            default:
                return "mdi:play-circle";
        }
    }

    static getThumbnailAspectRatio(category: string): string {
        switch (category.toLowerCase()) {
            case CategoryHelper.CATEGORY_MOVIES:
            case CategoryHelper.CATEGORY_TVSHOWS:
                return "2/3";
            case CategoryHelper.CATEGORY_EPISODES:
            case CategoryHelper.CATEGORY_MUSICVIDEOS:
                return "16/9";
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
        return [
            CategoryHelper.CATEGORY_ALBUMS,
            CategoryHelper.CATEGORY_ARTISTS,
            CategoryHelper.CATEGORY_MOVIES,
            CategoryHelper.CATEGORY_MUSICVIDEOS,
            CategoryHelper.CATEGORY_TVSHOWS,
            CategoryHelper.CATEGORY_EPISODES,
        ].includes(category.toLowerCase());
    }

    static isContainerCategory(category: string): boolean {
        return [CategoryHelper.CATEGORY_TVSHOWS, CategoryHelper.CATEGORY_ARTISTS].includes(category.toLowerCase());
    }
}

