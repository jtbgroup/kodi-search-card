export const CARD_VERSION = '4.0.0';

export const MEDIA_TYPE_PARAMS = {
  album: { label: 'Albums', icon: 'mdi:disc' },
  artist: { label: 'Artists', icon: 'mdi:account-circle' },
  song: { label: 'Songs', icon: 'mdi:music' },
  movie: { label: 'Movies', icon: 'mdi:movie' },
  tvshow: { label: 'TV Shows', icon: 'mdi:movie' },
  episode: { label: 'Episodes', icon: 'mdi:movie' },
  channel: { label: 'Channels', icon: 'mdi:movie' },
};

export const ACTION_MAP = {
  play: { label: 'Play', icon: 'mdi:play', method: 'play' },
  add: { label: 'Add', icon: 'mdi:plus', method: 'add' },
};

export const SORT_DESC = 'Desc';
export const DEFAULT_ADD_POSITION = 1;
export const DEFAULT_SHOW_THUMBNAIL = true;
export const DEFAULT_SHOW_THUMBNAIL_OVERLAY = true;
export const DEFAULT_SHOW_ACTION_MODE = true;
export const DEFAULT_ACTION_MODE = Object.keys(ACTION_MAP)[0];
export const DEFAULT_ALBUM_DETAILS_SORT = SORT_DESC;
