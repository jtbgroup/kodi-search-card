# Guide de migration — kodi-search-card restructuration

## Structure finale

```
src/
├── kodi-search-card.ts               ← Entrée Rollup, orchestrateur pur
├── editor.ts                         ← Éditeur HA (mwc-list-item → ha-list-item)
├── types.ts                          ← Inchangé
├── const.ts                          ← Inchangé
├── localize/
│   ├── localize.ts
│   └── languages/
│       ├── en.json
│       ├── fr.json
│       └── nb.json
├── styles/
│   ├── shared.styles.ts              ← Variables CSS :host + utilitaires communs
│   ├── cover.styles.ts               ← Styles du cover générique
│   ├── form.styles.ts                ← Styles du formulaire
│   └── media.styles.ts              ← Tous les styles média en exports nommés
└── components/
    ├── kodi-cover-element.ts         ← Cover générique réutilisable
    ├── kodi-search-form.ts           ← Formulaire (ha-textfield, ha-select)
    └── media/
        ├── kodi-media-songs.ts
        ├── kodi-media-albums.ts
        ├── kodi-media-albumdetail.ts
        ├── kodi-media-seasondetail.ts
        └── kodi-media-simple.ts      ← artists, movies, musicvideos, tvshows,
                                         episodes, channels, filemusicplaylist
```

---

## Ce qui a changé et pourquoi

### 1. CSS extraite dans `styles/`

Chaque fichier exporte une ou plusieurs constantes `css\`\`` de Lit.
Les composants composent leurs styles via un tableau :

```ts
static get styles(): CSSResultGroup {
    return [sharedStyles, songsStyles];
}
```

Avantage : Lit déduplique automatiquement les feuilles de style partagées
entre instances du même composant. Pas de copier-coller de CSS entre fichiers.

### 2. Composants média — communication par Custom Events

Chaque composant média reçoit ses données en propriétés et remonte les
actions utilisateur via des Custom Events `bubbles: true, composed: true`.
Le composant principal les intercepte au niveau de `#card-container` avec
un seul bloc de listeners.

**Tableau des événements émis :**

| Composant                    | Événement émis            | `detail`                        |
|------------------------------|---------------------------|---------------------------------|
| `kodi-search-form`           | `kodi-search`             | `{ value: string }`             |
| `kodi-search-form`           | `kodi-clear`              | —                               |
| `kodi-search-form`           | `kodi-recently-added`     | —                               |
| `kodi-search-form`           | `kodi-recently-played`    | —                               |
| `kodi-search-form`           | `kodi-current-artist`     | —                               |
| `kodi-search-form`           | `kodi-action-mode-changed`| `{ mode: string }`              |
| `kodi-media-songs`           | `kodi-play-song`          | `{ songId }`                    |
| `kodi-media-albums`          | `kodi-play-album`         | `{ albumId }`                   |
| `kodi-media-albumdetail`     | `kodi-play-album`         | `{ albumId }`                   |
| `kodi-media-albumdetail`     | `kodi-play-song`          | `{ songId }`                    |
| `kodi-media-seasondetail`    | `kodi-play-season`        | `{ episodeIds: number[] }`      |
| `kodi-media-seasondetail`    | `kodi-play-episode`       | `{ episodeId }`                 |
| `kodi-media-movies`          | `kodi-play-movie`         | `{ movieId }`                   |
| `kodi-media-musicvideos`     | `kodi-play-musicvideo`    | `{ musicVideoId }`              |
| `kodi-media-episodes`        | `kodi-play-episode`       | `{ episodeId }`                 |
| `kodi-media-channels`        | `kodi-play-channel`       | `{ channelId }`                 |
| `kodi-media-filemusicplaylist`| `kodi-play-playlist`     | `{ file: string }`              |
| `kodi-media-artists`         | `kodi-browse-artist`      | `{ artistId }`                  |
| `kodi-media-tvshows`         | `kodi-browse-tvshow`      | `{ tvShowId }`                  |
| `kodi-cover-element`         | `kodi-cover-action`       | —                               |

### 3. Anti-pattern `document.createElement` corrigé

**Avant** (`_createItemDetailsActionIcon`) :
```ts
// Crée un élément impérativement, attache des listeners manuellement,
// sans bénéficier du cycle de vie Lit ni du shadow DOM.
const playDiv = document.createElement("ha-icon");
playDiv.setAttribute("icon", this._getActionIcon());
playDiv.addEventListener("mouseover", () => this._highlightOver(...));
```

**Après** (dans `kodi-media-albumdetail` et `kodi-media-seasondetail`) :
```ts
// State réactif Lit + classes CSS conditionnelles dans le template.
// Aucun accès direct au DOM, aucune mutation de style impérative.
@state() private _hoveredSongId: string | null = null;

// Dans le template :
<div class="search-albumdetails-song-title ${this._hoveredSongId === song.songid ? 'highlighted' : ''}">
    ${song.title}
</div>
```

### 4. Composants `ha-*` dans le formulaire

#### `ha-textfield` remplace `<input type="text">`

```ts
// Déclaration
@query("ha-textfield") private _searchField!: HTMLElement & { value: string; focus(): void };

// Template
<ha-textfield
    label="Search criteria"
    @keydown=${this._onKeyDown}></ha-textfield>

// Lecture de la valeur dans le handler
const value = this._searchField?.value ?? "";

// Vider le champ après recherche
this._searchField.value = "";

// Focus programmatique
this._searchField.focus(); // délègue à l'<input> interne
```

#### `ha-select` + `ha-list-item` remplace `<select>`

```ts
<ha-select
    naturalMenuWidth
    fixedMenuPosition
    label="Action mode"
    .value=${this._currentMode}
    @selected=${this._onActionModeSelected}
    @closed=${(ev) => ev.stopPropagation()}>
    ${Object.keys(ACTION_MAP).map(action => html`
        <ha-list-item .value=${action}>${ACTION_MAP[action].label}</ha-list-item>
    `)}
</ha-select>
```

**Piège `@selected`** : cet événement se déclenche aussi au rendu initial,
pas seulement lors d'un choix utilisateur. Toujours garder :

```ts
private _onActionModeSelected(ev: CustomEvent): void {
    ev.stopPropagation();
    const newMode = (ev.target as any).value;
    if (!newMode || newMode === this._currentMode) return; // ← garde obligatoire
    this._currentMode = newMode;
    this._emit("kodi-action-mode-changed", { mode: newMode });
}
```

**`mwc-list-item` vs `ha-list-item`** : `mwc-list-item` fonctionne encore
dans HA 2024.x mais `ha-list-item` est le composant cible depuis HA 2024.
Utiliser `ha-list-item` partout (editor.ts et formulaire) pour uniformité.

#### `ha-button` — déjà le bon composant

`<ha-button raised @click=…>` est correct. Ne pas utiliser `<mwc-button>`
(déprécié) ni `<paper-button>` (supprimé).

### 5. Compatibilité Rollup

Le point d'entrée reste `src/kodi-search-card.ts`. Tous les sous-composants
sont importés via des side-effect imports au début de ce fichier :

```ts
import "./components/kodi-search-form";
import "./components/kodi-cover-element";
import "./components/media/kodi-media-songs";
// ...
```

Rollup les bundle tous dans `dist/kodi-search-card.js` sans configuration
supplémentaire. Les fichiers `rollup.config.js` et `rollup.config.dev.js`
sont **inchangés**.

---

## Étapes pour migrer le dépôt existant

```bash
# 1. Copier les nouveaux fichiers dans src/
cp -r <ce-dossier>/src/* ./src/

# 2. Vérifier que l'ancien kodi-search-card.ts est bien remplacé
git diff src/kodi-search-card.ts

# 3. Build de vérification
npm run build

# 4. Tests manuels à effectuer :
#    ✓ Recherche texte avec Entrée et bouton Search
#    ✓ Boutons Recently added / Recently played / Current Artist
#    ✓ Changement d'action mode (play ↔ add)
#    ✓ Clic sur un album (cover + overlay)
#    ✓ Hover sur une chanson dans albumdetail → gras
#    ✓ Clic sur l'icône play d'une chanson dans albumdetail
#    ✓ Hover sur un épisode dans seasondetail → gras
#    ✓ Thumbnails HA-authentifiées (/api/...) chargées correctement
#    ✓ Éditeur de carte — tous les champs sauvegardés
```

---

## Points d'attention restants

- **`show_thumbnail`** : la prop est déclarée dans la config mais non
  transmise au composant cover dans certains types (movies, tvshows…) car
  leurs URLs ne passent pas par `/api`. Si vous voulez masquer les posters
  de films quand `show_thumbnail: false`, il faudra conditionner `imageUrl`
  dans les composants concernés.

- **Images non-API** (movies, episodes, musicvideos) : ces composants
  passent l'URL directement via `imageUrl` (pas de `imagePromise`),
  donc pas d'authentification HA. C'est le comportement original.

- **`filemusicplaylist`** dans `kodi-media-simple.ts` : regroupé avec les
  autres composants simples pour éviter une prolifération de fichiers.
  Si ce type grossit, extraire dans son propre fichier.
