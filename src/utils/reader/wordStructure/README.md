# Word structure reading aid

An on-demand popup that shows the morphological structure of a clicked word:
the school-style morpheme breakdown, the derivation chain, the word-formation
family tree, and per-word glosses. Built for language learners reading
foreign-language books.

Double-click a word in the reader and pick **Word structure** from the
selection menu. Nothing on the page is modified; the popup only reads the
selection.

## Architecture

Each language is a `word-structure` plugin: a pure-JSON manifest (no script)
that points at a data pack and declares its language profile. The core engine
lives here and is shared across languages.

| File | Role |
| --- | --- |
| `wordStructurePlugin.ts` | Plugin manifest type + lookup helpers |
| `nestPack.ts` | Multi-language pack loader (fetch, SHA-256 verify, parse, lookup) |
| `languageProfiles.ts` | Per-language token pattern, key normalization, notation |
| `morphemeParse.ts` | Synthesizes the morpheme breakdown from a derivation chain |
| `bookLanguage.ts` | Detects and caches a book's language for plugin routing |
| `aiGlossProvider.ts` | Optional AI glosses via the user's configured model |

The AI does language, not linguistics: structure comes from the data packs,
and the model only translates the already-determined structure into the user's
target language.

## Data packs

The `.tsv` packs and their `*-word-structure.plugin.json` manifests under
`public/assets/word-structure/` are the plugin's payload and are committed
(~51 MB): the pack is the plugin, and its upstream inputs (MorphyNet's `main`
branch, a ru.wiktionary dump) are neither version-pinned nor vendored here, so
the committed packs are the only reproducible form of this data.

`scripts/buildWordStructurePack.mjs` documents how the packs were produced and
lets you rebuild them from fresh inputs (the manifests record each file's
SHA-256, which the loader verifies):

```bash
# Russian (needs MorphyNet rus TSVs, OpenRussian CSVs, ruwiktionary морфо-ru,
# DerivBase.Ru edge list)
node scripts/buildWordStructurePack.mjs --lang ru \
  --adopt-edges derivbase-ru.v1.tsv --morpho morfo-ru.v1.tsv \
  rus.derivational.v1.tsv rus.inflectional.v1.tsv openrussian-csv-dir/

# English
node scripts/buildWordStructurePack.mjs --lang en \
  eng.derivational.v1.tsv eng.inflectional.v1.tsv
```

The largest file, `ru.forms.v1.tsv` (~27 MB, the inflected-form → lemma
table), dominates the size. If repo weight becomes a concern, the packs could
be shipped gzipped and inflated in the loader with `fflate` (already a
dependency), or hosted on a CDN with the manifest pointing at absolute URLs.

## Data sources and licenses

| Source | Use | License |
| --- | --- | --- |
| MorphyNet | Word-formation families and chains | CC BY-SA 3.0 |
| ru.wiktionary морфо-ru templates | Russian morpheme dictionary | CC BY-SA 4.0 |
| DerivBase.Ru | Fills MorphyNet's missing derivations | Apache-2.0 |
| OpenRussian | Russian → English/German glosses | CC BY-SA 4.0 |
