# SEARCH CARD - Changelog

## 3.0.0

- Migration to LiteElement and standardisation of the components (mwc)
- New project structure to use the builder from the boilerplate
- Modifications in the config: rename of the 'order' property, added 2 sort options for the album details

    **BREAKING CHANGES**
    - Config property `order` is no longer available and must be renamed by `media_type_order`
    - Config property `album_details_sort` uses new values; old ones are not valid anymore

    Check the Readme for new config properties
## 2.8.0

- Entries in album and tvshow details are highlighted in bold when mouse over the action button (see [issue #11](https://github.com/jtbgroup/kodi-search-card/issues/11)). Thanks to [Roumano](https://github.com/roumano)

## 2.7.2

- Bugfix: card is again visible in the card chooser (see [issue #10](https://github.com/jtbgroup/kodi-search-card/issues/10))
- Bugfix: buttons layout is now correct when hiding the action mode component

## 2.7.1

- Bugfix: choose the right playlist when playing or adding an item (id of the player isn't constant in rpc methods) (see [issue#9](https://github.com/jtbgroup/kodi-search-card/issues/9))

## 2.7.0

- Option to change the order of media types (see [issue #8](https://github.com/jtbgroup/kodi-search-card/issues/8))

## 2.6.2

- Changed layout a little bit to fit smartphone's screen

## 2.6.1

- Added config property to display or not the Action Mode component

## 2.6.0

- Added the action mode option to choose between add and play (see [issue #6](https://github.com/jtbgroup/kodi-search-card/issues/6))

## 2.5.1

- Layout reviewed for Albums and tvshow episodes lists: removed duration and moved title under the cover

## 2.5.0

- Sorting Albums option

## 2.4.1

- css improvements
- Bugfix : make available in the card chooser (regression)
- order of the properties in the editor

## 2.3.1

- bugfix : episode play button had disappeared

## 2.3.0

- PVR Channels can now be displayed if searched by the sensor

## 2.2.0

- Card editor + made available in the card picker

## 2.1.4

- compatible with [kodi media sensors](https://github.com/jtbgroup/kodi-media-sensors) 3.1.5
- new options: show_thumbnail_overlay, show_thumbnail_border, thumbnail_border_color
- Added button **'Recently Added'**
- CSS & layout refactoring
- Default image used when not showing thumbnail is also used as backup when problem happens while loading the image

## 2.0.0

- compatible with [kodi media sensors](https://github.com/jtbgroup/kodi-media-sensors) 3.0.0
- bugfix: displaying genre bug fixed
- bugfix: search components had a strange behaviour on some platform

## 1.0

First version
