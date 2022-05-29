export const CARD_VERSION = "3.1.2";

// order : must be >= 0 to be taken in consideration. -1, means single displayable
export const MEDIA_TYPE_PARAMS = {
    song: { id: "song", label: "Songs", icon: "mdi:music", order: 0 },
    album: { id: "album", label: "Albums", icon: "mdi:disc", order: 1 },
    artist: { id: "artist", label: "Artists", icon: "mdi:account-circle", order: 2 },
    movie: { id: "movie", label: "Movies", icon: "mdi:movie", order: 3 },
    tvshow: { id: "tvshow", label: "TV Shows", icon: "mdi:movie", order: 4 },
    episode: { id: "episode", label: "Episodes", icon: "mdi:movie", order: 5 },
    channel: { id: "channel", label: "Channels", icon: "mdi:movie", order: 6 },
    seasondetail: { id: "seasondetail", label: "Season Detail", icon: "mdi:movie", order: -1 },
    albumdetail: { id: "albumdetail", label: "Album Detail", icon: "mdi:music", order: -1 },
};
export const MEDIA_TYPES = Object.keys(MEDIA_TYPE_PARAMS);
export const MEDIA_TYPES_SINGLE_DISPLAY = MEDIA_TYPES.filter(type => MEDIA_TYPE_PARAMS[type].order == -1);

export const ACTION_MAP = {
    play: { id: "play", label: "Play", icon: "mdi:play", method: "play" },
    add: { id: "add", label: "Add", icon: "mdi:plus", method: "add" },
};

export const ALBUM_SORT = {
    date_asc: { id: "date_asc", label: "Date Ascending" },
    date_desc: { id: "date_desc", label: "Date Descending" },
    title_asc: { id: "title_asc", label: "Title Ascending" },
    title_desc: { id: "title_desc", label: "Title Descending" },
};

export const DEFAULT_ENTITY_NAME = "sensor.kodi_media_sensor_search";
export const DEFAULT_ADD_POSITION = 1;
export const DEFAULT_SHOW_THUMBNAIL = true;
export const DEFAULT_SHOW_THUMBNAIL_OVERLAY = true;
export const DEFAULT_SHOW_ACTION_MODE = true;
export const DEFAULT_ACTION_MODE = "play";
export const DEFAULT_ALBUM_DETAILS_SORT = "date_desc";
export const DEFAULT_SHOW_THUMBNAIL_BORDER = false;
export const DEFAULT_OUTLINE_COLOR = "var(--primary-text-color)";
export const DEFAULT_MEDIA_TYPE_ORDER = MEDIA_TYPES.filter(type => MEDIA_TYPE_PARAMS[type].order >= 0).sort(
    (a, b) => MEDIA_TYPE_PARAMS[a].order - MEDIA_TYPE_PARAMS[b].order,
);

