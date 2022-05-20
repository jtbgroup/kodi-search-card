import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'kodi-search-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface KodiSearchCardConfig extends LovelaceCardConfig {
  // type: string;
  entity?: string;
  title?: string;
  show_thumbnail?: boolean;
  show_thumbnail_overlay?: boolean;
  show_thumbnail_border?: boolean;
  outline_color: string;
  album_details_sort: string;
  show_action_mode?: boolean;
  action_mode: string;
  add_position: string;
  order: string[];
  // media_type_order;
  // show_warning?: boolean;
  // show_error?: boolean;
  // test_gui?: boolean;
  // tap_action?: ActionConfig;
  // hold_action?: ActionConfig;
  // double_tap_action?: ActionConfig;
}
