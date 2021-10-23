# Kodi-Search-Card

This card displays a search form to query the kodi entity.

This card is intented to be an alternative to an iframe containing Chorus.

| Search Form |
| ---- |
<img src="https://raw.githubusercontent.com/jtbgroup/kodi-search-card/master/assets/search_result_v3.1.png" alt="Search Form" width="400"/> 

## Requirements

This card requires a specific sensor that gets the data from Kodi. The sensor is provided by the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors) (at least)

## Features

The card will let you search items in kodi. 
You can pdirectly play items in your kodi instance.

## Installation

1. Install the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors).
2. Install the card using HACS
3. Reference the new resouce in lovelace

```json
- url: hacsfiles/kodi-search-card/kodi-search-card.js
  type: Javascript module
```

## Card options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string	| **required** | v1.0.0 | `custom:kodi-search-card` |
| entity | string | **required** | v1.0.0 |  `sensor.kodi_media_sensor_search` |
| title | string | optional | v1.0.0 | The title of the card |
| show_thumbnail | boolean | `false` | v1.0.0 | Set to true if you want to show the thumbnails coming from kodi. Attention you can get problems when mixing http and https content; if so, leave it to false. |
| show_thumbnail_overlay| boolean | `true` | v2.1 | When true, adds an lightgrey overlay above the thumbnail; this might be useful to see better the play icon displayed above the thumbnail.
| show_thumbnail_border | boolean | `false` | v2.1 | When true, adds a 1px border around the thumbanils.
| thumbnail_border_color | string | optional<br/>default: `white` | v2.1 | THis option is only used when **show_thumbnail_border** is true. The color can be a string (ex: 'white', 'red', 'green', ... ), rgb format (ex: 'rgb(10, 12, 250)') or hexa format (ex: '#EE22FF').

**No need to pass the entity of the Kodi player as it is embedded in the data of the sensor.**
