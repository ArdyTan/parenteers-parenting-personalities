# Parenting Bakes UI Icons

This folder contains the approved outline family as standalone SVG files: the 16 original
icons plus the two sound-toggle states added with the audio layer.

- Canvas: square `64 × 64` viewBox
- Stroke: `4 px`, round caps and joins
- Orange icons: `#E86811`
- Deep-blue icons: `#182799`
- Fill: none, except the intentionally solid circular eye/dot details
- Accessibility: decorative by default (`aria-hidden="true"`); the consuming button or link supplies its accessible name

All circular geometry uses SVG `<circle>` elements with a single radius. The files contain no `<ellipse>` elements and no transforms that can distort a circle into an oval.

| Icon | File | Color |
|---|---|---|
| Share | `share.svg` | Orange |
| Star | `star.svg` | Orange |
| Stopwatch | `stopwatch.svg` | Orange |
| Featured star | `star-featured.svg` | Orange |
| Smile | `smile.svg` | Deep blue |
| Question bubble | `question.svg` | Deep blue |
| Check | `check.svg` | Orange |
| Emphasis rays | `emphasis.svg` | Orange |
| Download | `download.svg` | Orange |
| Heart | `heart.svg` | Deep blue |
| Chef hat | `chef-hat.svg` | Deep blue |
| Close | `close.svg` | Orange |
| Instagram | `instagram.svg` | Deep blue |
| Web | `web.svg` | Deep blue |
| Mail | `mail.svg` | Deep blue |
| Thumbs up | `thumbs-up.svg` | Orange |
| Sound on | `sound-on.svg` | Deep blue |
| Sound off | `sound-off.svg` | Deep blue |

## Layout marks (not part of the 16-icon family)

Two additional files ship for Phase 5.5. They come straight from the Brilliant
`figma-parenting-personalities` design system, so they intentionally break the rules above:
their own viewBox, filled geometry, and no 4 px stroke. Do not "normalise" them to 64 × 64 —
their proportions are what makes them read correctly at their intended size.

| Mark | File | Native size | Role |
|---|---|---|---|
| Button expression | `button-expression.svg` | `12 × 20` | Rides after the label on every bottom CTA (`.button--primary::after`); rotated and lifted per spec |
| Progress star | `progress-bar-star.svg` | `18 × 20` | The 12 stops on the question progress rail; answered at full opacity, remaining at `0.20` |

Both are painted `#E86811` in the file, so they are used as `background-image` and need no
runtime tinting.
