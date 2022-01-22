# Kodi-Search-Card

This card displays a search form to query the kodi entity.

This card is intented to be an alternative to an iframe containing Chorus.

| Search Form | Search Form | 
| ---- | ---- |
| ![Kodi Search Card](./assets/search_result_v2.6_1.png) | ![Kodi Search Card](./assets/search_result_v2.6_2.png) |

## Requirements

This card requires a specific sensor that gets the data from Kodi. The sensor is provided by the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors) (at least)

## Features

The card will let you search items in kodi.
You can display the recently added items.
You can directly play items in your kodi instance.

The search function will look for songs (title), albums (title), artists (name), movies (title), tvshows (title), PVR Channels (label) [only if a PVR client addon is present].

## Installation

1. Install the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors).
2. Install the card using HACS

Manual installation is of course possible, but not explained here as there are plenty of tutorials.

## Card options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string	| **required** | v1.0.0 | `custom:kodi-search-card` |
| entity | string | **required** | v1.0.0 |  `sensor.kodi_media_sensor_search` |
| title | string | optional | v1.0.0 | The title of the card |
| show_thumbnail | boolean | `false` | v1.0.0 | Set to true if you want to show the thumbnails coming from kodi. Attention you can get problems when mixing http and https content; if so, leave it to false. |
| show_thumbnail_overlay| boolean | `true` | v2.1 | When true, adds an lightgrey overlay above the thumbnail; this might be useful to see better the play icon displayed above the thumbnail.
| show_thumbnail_border | boolean | `false` | v2.1 | When true, adds a 1px border around the thumbanils.
| outline_color | string | optional<br/>default: `white` | v2.1 | This option is only used when **show_thumbnail_border** is true. The color can be a string (ex: 'white', 'red', 'green', ... ), rgb format (ex: 'rgb(10, 12, 250)') or hexa format (ex: '#EE22FF').
| album_details_sort | string | Optional<br/> default: 'Desc' | 2.5.0 | After a first search, you can drill down by clicking on an artist to see the all the albums. This list of albums can bes sorted based on the year of the album. Values can be "Asc" or "Desc". |
| action_mode | string | Optional <br /> default: 'Play'| 2.6.0 | This property allows to choose between 'Add' ou 'Play' as action when clicking on an item. The value is overridden by the value of the Action Mode component in the search form of the card. |
| add_position | integer | Optional<br /> default: 1 | 2.6.0 | This value indicates where to add an item in the playlist.<br/>0 = first position, 1 = second position, 1000 = 1001th position. To add an item as last position, use a value that is > than the size of the playlist.<br/> This parameters is only useful when selecting 'Add' as action mode (card configuration and/or search form of the card) |

Example:

``` yaml
    type: custom:kodi-search-card
    entity: sensor.kodi_media_sensor_search
    show_thumbnail: true
    show_thumbnail_border: true
    show_thumbnail_overlay: true
    outline_color: rgb(74,200,50)
```
