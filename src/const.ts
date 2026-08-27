export const CARD_VERSION = "5.0.4";

export const CATEGORY_MOVIES = "movies";
export const CATEGORY_SONGS = "songs";
export const CATEGORY_MUSICVIDEOS = "musicvideos";
export const CATEGORY_ARTISTS = "artists";
export const CATEGORY_ALBUMS = "albums";
export const CATEGORY_EPISODES = "episodes";
export const CATEGORY_SEASONS = "seasons";
export const CATEGORY_TVSHOWS = "tvshows";
export const CATEGORY_CHANNELS = "channels";
export const CATEGORY_MUSICPLAYLISTS = "musicplaylists";
export const CATEGORIES = {
    movies: { id: "movies", label: "movies" },
    songs: { id: "songs", label: "songs" }, // Corrigé
    musicvideos: { id: "musicvideos", label: "music videos" },
    artists: { id: "artists", label: "artists" },
    albums: { id: "albums", label: "albums" },
    episodes: { id: "episodes", label: "episodes" },
    seasons: { id: "seasons", label: "seasons" },
    tvshows: { id: "tvshows", label: "tv shows" },
    channels: { id: "channels", label: "channels" }, // Corrigé
    musicplaylists: { id: "musicplaylists", label: "music playlists" },
};

// order: must be >= 0 to be taken into consideration. -1 means single-displayable (detail views).
export const MEDIA_TYPE_PARAMS = {
    song: { id: "song", label: "Songs", icon: "mdi:music", order: 0 },
    album: { id: "album", label: "Albums", icon: "mdi:disc", order: 1 },
    artist: { id: "artist", label: "Artists", icon: "mdi:account-circle", order: 2 },
    movie: { id: "movie", label: "Movies", icon: "mdi:movie", order: 3 },
    musicvideo: { id: "musicvideo", label: "Music Videos", icon: "mdi:movie", order: 4 },
    tvshow: { id: "tvshow", label: "TV Shows", icon: "mdi:movie", order: 5 },
    episode: { id: "episode", label: "Episodes", icon: "mdi:movie", order: 6 },
    channel: { id: "channel", label: "Channels", icon: "mdi:movie", order: 7 },
    // seasondetail: { id: "seasondetail", label: "Season Detail", icon: "mdi:movie", order: -1 },
    // albumdetail: { id: "albumdetail", label: "Album Detail", icon: "mdi:music", order: -1 },
    musicplaylist: { id: "musicplaylist", label: "Music Playlists", icon: "mdi:music", order: 8 },
};

export const MEDIA_TYPES = Object.keys(MEDIA_TYPE_PARAMS);
export const MEDIA_TYPES_SINGLE_DISPLAY = MEDIA_TYPES.filter(type => MEDIA_TYPE_PARAMS[type].order === -1);

export const ACTION_MAP = {
    play: { id: "play", label: "Play", icon: "mdi:play", method: "play" },
    add: { id: "add", label: "Add", icon: "mdi:plus", method: "add" },
} as const;

export const ADD_POSITION = {
    next: { id: "next", label: "Next" },
    last: { id: "last", label: "Last" },
} as const;

export const ALBUM_SORT = {
    date_asc: { id: "date_asc", label: "Date Ascending" },
    date_desc: { id: "date_desc", label: "Date Descending" },
    title_asc: { id: "title_asc", label: "Title Ascending" },
    title_desc: { id: "title_desc", label: "Title Descending" },
};

export const DEFAULT_ENTITY_NAME = "sensor.kodi_media_sensor_search";
export const DEFAULT_ADD_POSITION = ADD_POSITION.last;
export const DEFAULT_SHOW_THUMBNAIL = true;
export const DEFAULT_SHOW_THUMBNAIL_OVERLAY = true;
export const DEFAULT_SHOW_VERSION = false;
export const DEFAULT_ACTION_MODE = ACTION_MAP.play.id;
export const DEFAULT_SHOW_ACTION_MODE = true;
export const DEFAULT_SHOW_RECENTLY_ADDED = true;
export const DEFAULT_SHOW_RECENTLY_PLAYED = true;
export const DEFAULT_SHOW_CURRENT_ARTIST = true;
export const DEFAULT_SHOW_MUSIC_PLAYLIST = true;
export const DEFAULT_ALBUM_DETAILS_SORT = "date_desc";
export const DEFAULT_SHOW_THUMBNAIL_BORDER = true;
export const DEFAULT_OUTLINE_COLOR = "var(--primary-text-color)";
export const DEFAULT_MEDIA_TYPE_ORDER = MEDIA_TYPES.filter(type => MEDIA_TYPE_PARAMS[type].order >= 0).sort(
    (a, b) => MEDIA_TYPE_PARAMS[a].order - MEDIA_TYPE_PARAMS[b].order,
);

export const MUSIC_PLAYLIST_EXTENSIONS_ALLOWED = [".xsp", ".m3u", ".m3u8", ".cue"];

export const PLAYLISTID_AUDIO = 0;
export const PLAYLISTID_VIDEO = 1;

