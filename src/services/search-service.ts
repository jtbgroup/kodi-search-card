import { HomeAssistant } from "custom-card-helpers";
import { SearchResults, SearchResultItem } from "../types";

interface WebSocketRequest {
    type: string;
    entry_id?: string;
    kodi_entity_id?: string;
    query?: string;
    category?: string;
    artistid?: number | string;
    tvshow_id?: number | string;
}

interface WebSocketResponse {
    results?: SearchResults;
    entity_id?: string;
    items?: SearchResultItem[];
    [key: string]: unknown;
}

export class SearchService {
    constructor(
        private hass: HomeAssistant,
        private resolvedEntryId: string,
    ) {}

    async search(query: string): Promise<SearchResults> {
        if (!query.trim()) {
            return {};
        }

        try {
            const request: WebSocketRequest = {
                type: "kodi_media_sensors/search",
                entry_id: this.resolvedEntryId,
                query,
                category: "all",
            };
            const response = (await this.hass.callWS(request)) as WebSocketResponse;
            return response?.results ?? {};
        } catch (error) {
            console.error("Search error:", error);
            return {};
        }
    }

    async searchRecentlyPlayed(): Promise<SearchResults> {
        return this._navigation("recently_played");
    }

    async searchRecentlyAdded(): Promise<SearchResults> {
        return this._navigation("recently_added");
    }

    async searchCurrentArtist(artistId: number | string): Promise<SearchResults> {
        try {
            const result = await this.hass.callWS<SearchResults>({
                type: "kodi_media_sensors/search_artist",
                entry_id: this.resolvedEntryId,
                artist_id: artistId,
            });
            return result ?? {};
        } catch (e) {
            console.error("Error searching current artist:", e);
            return {};
        }
    }

    async searchTvShow(tvshowId: number | string): Promise<SearchResults> {
    try {
        const result = await this.hass.callWS<SearchResults>({
            type: "kodi_media_sensors/search_tvshow",
            entry_id: this.resolvedEntryId,
            tvshow_id: tvshowId,
        });
        return result ?? {};
    } catch (e) {
        console.error("Error searching TV show:", e);
        return {};
    }
}

    private async _navigation(type: string): Promise<SearchResults> {
        try {
            const wsType = `kodi_media_sensors/search_${type}`;
            const payload: Record<string, any> = {
                entry_id: this.resolvedEntryId,
            };

            const result = await this.hass.callWS<{
                items?: SearchResultItem[];
                results?: SearchResults;
            }>({
                type: wsType,
                ...payload,
            });

            if (result.results) {
                return result.results;
            } else if (result.items) {
                return { songs: result.items };
            } else {
                return result as unknown as SearchResults;
            }
        } catch (e) {
            console.error(`Navigation error [${type}]:`, e);
            return {};
        }
    }
}
