# AION 2 class character renders

These are **eight class-specific, transparent full-body character renders from NCSOFT's
AION 2 promotional/class-showcase artwork**, used to identify the playable classes
in DaevaArchitect Global. They are **not** the user's imported appearance or
an AI-generated likeness.

- Official publisher/class-showcase reference:
  https://aion2.plaync.com/en-us/about/index
- Source image layer mirror (the publisher's promotional figures isolated from
  their decorative background):
  https://aion2.online/wp-content/uploads/2025/08/class-layer-1-char.png
  through `class-layer-8-char.png`.
- Importer: `scripts/import_official_class_art.py`. It validates the source PNG,
  original pixel dimensions and non-opaque alpha channel, and produces
  **lossless RGBA WebP** without resizing or repainting the character.
- The resulting files are **self-hosted** under `assets/class-renders/` and
  copied into `dist/` during the ordinary site build.

| Index | Filename | Class | Source resolution |
| --- | --- | --- | --- |
| 1 | gladiator.webp | Gladiator | 926 × 1385 |
| 2 | templar.webp | Templar | 938 × 1364 |
| 3 | assassin.webp | Assassin | 934 × 1380 |
| 4 | ranger.webp | Ranger | 1494 × 1407 |
| 5 | chanter.webp | Chanter | 954 × 1455 |
| 6 | cleric.webp | Cleric | 957 × 1414 |
| 7 | sorcerer.webp | Sorcerer | 876 × 1416 |
| 8 | spiritmaster.webp | Spiritmaster | 862 × 1342 |

**Artwork © NCSOFT.** All rights remain with their respective owners.
DaevaArchitect is an unofficial fan-made character planner and is not
affiliated with or endorsed by NCSOFT. These renders are used for
identification and visual presentation; this source list is attribution,
not a claim of redistributable licensing or a publisher endorsement.
