# Parenting Bakes Design Tokens

**Purpose:** Figma-ready reference for the visual system currently implemented in the app.

**Canonical design frame:** `390 × 844 px`

The implementation source of truth remains:

- `src/styles/tokens.css` — token values and semantic roles
- `src/styles/fonts.css` — bundled font files and supported weights
- `src/styles/base.css` — default typography assignments
- `src/core/brand.ts` — official Parenteers color and asset registry
- `src/data/types.json` — the 16 result-specific accent colors

The official Parenteers asset pack supplied the palette, logos, and favicons, but no typography specification. Fraunces and Plus Jakarta Sans are therefore the current project typography system rather than a confirmed official Parenteers font pairing.

## 1. Typography

### Font families

| Role | Family | Current bundled file | Fallback |
|---|---|---|---|
| Display and headings | Fraunces Variable | `public/fonts/fraunces-latin-variable.woff2` | Iowan Old Style, Palatino Linotype, Georgia, serif |
| Body and UI | Plus Jakarta Sans Variable | `public/fonts/plus-jakarta-sans-latin-variable.woff2` | Inter, system UI, Segoe UI, sans-serif |

The Parenteers logo and wordmark use supplied image assets; do not recreate them as typed text.

### Font weights

| Token | Weight | Typical use |
|---|---:|---|
| Regular | `400` | Body copy |
| Medium | `500` | Medium emphasis |
| Semibold | `600` | Metadata and small labels |
| Bold | `700` | Headings, buttons, strong labels |
| Black | `800` | Heavy display emphasis |

### Fraunces variable axes

| Use | SOFT | WONK | Optical size |
|---|---:|---:|---:|
| Standard heading | `72` | `1` | `36` |
| Hero/display | `72` | `1` | `72` |

If Figma does not expose the variable axes, use Fraunces Bold as the practical fallback.

### Figma text styles

These are rounded Figma values resolved from the fluid CSS scale at a `390 px` container width.

| Suggested Figma style | Family | Weight | Size | Line height | Tracking |
|---|---|---:|---:|---:|---:|
| `Display/Hero` | Fraunces | 700 | `60 px` | `92%` | `-4%` |
| `Display/H2` | Fraunces | 700 | `48 px` | `104%` | `-2.5%` |
| `Heading/H3` | Fraunces | 700 | `36 px` | `104%` | `-2.5%` |
| `Heading/H4` | Fraunces | 700 | `27 px` | `104%` | `-2.5%` |
| `Heading/Small` | Fraunces | 700 | `21 px` | `104%` | `-2.5%` |
| `Body/Lead` | Plus Jakarta Sans | 400 | `18 px` | `158%` | `-0.8%` |
| `Body/Default` | Plus Jakarta Sans | 400 | `16 px` | `158%` | `-0.8%` |
| `UI/Small` | Plus Jakarta Sans | 600 | `13 px` | `124%` | `0%` |
| `UI/Label` | Plus Jakarta Sans | 700 | `12 px` | `124%` | `7.5%` |

### Exact fluid type tokens

| Token | CSS value | Resolved at 390 px |
|---|---|---:|
| `font-size-xs` | `clamp(0.72rem, 0.67rem + 0.22cqi, 0.8rem)` | `11.58 px` |
| `font-size-sm` | `clamp(0.82rem, 0.77rem + 0.24cqi, 0.92rem)` | `13.26 px` |
| `font-size-body` | `clamp(0.96rem, 0.9rem + 0.3cqi, 1.08rem)` | `15.57 px` |
| `font-size-lead` | `clamp(1.08rem, 1rem + 0.42cqi, 1.24rem)` | `17.64 px` |
| `font-size-title-sm` | `clamp(1.28rem, 1.09rem + 0.92cqi, 1.64rem)` | `21.03 px` |
| `font-size-title-md` | `clamp(1.65rem, 1.3rem + 1.7cqi, 2.3rem)` | `27.43 px` |
| `font-size-title-lg` | `clamp(2.15rem, 1.58rem + 2.85cqi, 3.25rem)` | `36.40 px` |
| `font-size-display` | `clamp(2.8rem, 1.85rem + 4.75cqi, 4.65rem)` | `48.13 px` |
| `font-size-hero` | `clamp(3.45rem, 2.08rem + 6.85cqi, 6.1rem)` | `60.00 px` |

## 2. Color

### Official brand palette

| Suggested Figma variable | Value | Primary use |
|---|---|---|
| `Brand/Canvas` | `#F0F1F5` | Main app background and light text on dark controls |
| `Brand/Deep Blue` | `#182799` | Accessible text, headings, buttons, and frame |
| `Brand/Bright Blue` | `#3073E9` | Focus, strong borders, and secondary accents |
| `Brand/Orange` | `#E86811` | Primary decorative accent |

### Surfaces

| Suggested Figma variable | Value | Primary use |
|---|---|---|
| `Surface/Background` | `#F0F1F5` | Default canvas |
| `Surface/Editorial Warm` | `#FEF2E1` | Warm result and Story compositions |
| `Surface/Lavender` | `#EFEDFF` | Soft tags and containers |
| `Surface/Subtle` | `#F7F8FB` | Cards and controls |
| `Surface/Raised` | `#FFFFFF` | Raised cards, sheets, and dialogs |

### Semantic colors

| Suggested Figma variable | Value |
|---|---|
| `Text/Primary` | `#182799` |
| `Text/Muted` | `#182799` at `72%` |
| `Interactive/Primary` | `#182799` |
| `Interactive/On Primary` | `#F0F1F5` |
| `Interactive/Secondary` | `#3073E9` |
| `Accent/Primary` | `#E86811` |
| `Accent/Orange Soft` | `#E86811` at `14%` |
| `Accent/Blue Soft` | `#3073E9` at `14%` |
| `Border/Default` | `#182799` at `17%` |
| `Border/Strong` | `#3073E9` |
| `Focus/Default` | `#3073E9` |
| `Overlay/Default` | `#182799` at `52%` |
| `Overlay/Soft` | `#182799` at `16%` |
| `State/Disabled` | `#182799` at `46%` |

Bright blue and orange are primarily graphical accents. Deep blue is the accessible text and control color.

### Result-specific accent colors

Result pages replace the default orange accent with the personality color stored in `src/data/types.json`.

| Code | Slug | Accent |
|---|---|---|
| `PCTE` | Croquembouche | `#D69E62` |
| `PCTN` | Lapis Legit | `#C77D57` |
| `PCDE` | Baguette | `#DDA85A` |
| `PCDN` | Milk Bread | `#E7C9A9` |
| `PGTE` | Cronut | `#D99058` |
| `PGTN` | Pandan Chiffon | `#9AB67B` |
| `PGDE` | Pretzel | `#B87945` |
| `PGDN` | Muffin | `#C88B72` |
| `FCTE` | Molten Lava Cake | `#8F5147` |
| `FCTN` | Cinnamon Roll | `#C98A5B` |
| `FCDE` | Bagel | `#C7A06B` |
| `FCDN` | Banana Bread | `#E2BE62` |
| `FGTE` | Pavlova | `#E6AFC0` |
| `FGTN` | Tiramisu | `#9C755D` |
| `FGDE` | Focaccia | `#A8A064` |
| `FGDN` | Bolu Kukus | `#D89AB3` |

Use `Accent/Primary` for generic wireframes. Apply the personality accent only to result-specific frames and components.

## 3. Spacing and Layout

### Figma spacing scale

These rounded values correspond to the runtime scale at the `390 px` design width.

| Suggested Figma variable | Figma value | Exact runtime value |
|---|---:|---:|
| `Space/3XS` | `3 px` | `3.31 px` |
| `Space/2XS` | `6 px` | `5.81 px` |
| `Space/XS` | `9 px` | `9.16 px` |
| `Space/SM` | `13 px` | `12.90 px` |
| `Space/MD` | `17 px` | `17.00 px` |
| `Space/LG` | `23 px` | `22.76 px` |
| `Space/XL` | `31 px` | `30.76 px` |
| `Space/2XL` | `41 px` | `41.38 px` |
| `Space/3XL` | `55 px` | `55.33 px` |

### Layout contracts

| Token | Value |
|---|---:|
| Canonical phone canvas | `390 × 844 px` |
| Phone aspect ratio | `390 / 844` |
| Page gutter at 390 px | `17 px` |
| Minimum touch target | `44 × 44 px` |
| Content maximum width | `42 rem` |
| Copy maximum width | `34 rem` |
| Desktop phone-frame bezel | `12 px` |

On real devices, combine the page gutter with the operating-system safe-area inset and use whichever is larger.

## 4. Geometry

### Borders

| Suggested Figma variable | Value |
|---|---:|
| `Border/Hairline` | `1 px` |
| `Border/Strong` | `2 px` |
| `Focus/Ring Width` | `3 px` |
| `Focus/Ring Offset` | `3 px` |

### Corner radii

| Suggested Figma variable | Figma value | Exact CSS value |
|---|---:|---:|
| `Radius/XS` | `7 px` | `0.45 rem` |
| `Radius/SM` | `12 px` | `0.75 rem` |
| `Radius/MD` | `18 px` | `1.1 rem` |
| `Radius/LG` | `26 px` | `1.6 rem` |
| `Radius/XL` | `36 px` | `2.25 rem` |
| `Radius/Pill` | `999 px` | `999 px` |
| `Radius/Phone Frame` | `52 px` | `3.25 rem` |
| `Radius/Phone Screen` | `39 px` | `2.45 rem` |

## 5. Effects

### Shadows

| Suggested Figma effect | X | Y | Blur | Spread | Color |
|---|---:|---:|---:|---:|---|
| `Shadow/SM` | `0` | `4` | `12` | `0` | `#182799` at `16%` |
| `Shadow/MD` | `0` | `12` | `32` | `0` | `#182799` at `16%` |
| `Shadow/LG` | `0` | `24` | `64` | `0` | `#182799` at `28%` |
| `Shadow/Focus` | `0` | `0` | `0` | `6` | `#3073E9` at `28%` |

### Texture

| Token | Value |
|---|---|
| Grain opacity | `4.5%` |
| Pattern opacity | `8.5%` |
| Grain size | `160 px` |
| Pattern size | `256 px` |
| Blend mode | Multiply |

The runtime currently retains its CSS/grain treatment because there is no active production pattern asset.

## 6. Motion

### Durations

| Suggested token | Value |
|---|---:|
| `Duration/Micro Fast` | `120 ms` |
| `Duration/Micro` | `160 ms` |
| `Duration/Micro Slow` | `200 ms` |
| `Duration/Reveal Fast` | `400 ms` |
| `Duration/Reveal` | `500 ms` |
| `Duration/Reveal Slow` | `600 ms` |
| `Duration/Scene` | `700 ms` |
| `Duration/Scene Slow` | `900 ms` |
| `Stagger/Fast` | `40 ms` |
| `Stagger/Default` | `55 ms` |
| `Stagger/Slow` | `70 ms` |

### Easings

| Suggested token | CSS value |
|---|---|
| `Ease/Linear` | `linear` |
| `Ease/Standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `Ease/Out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `Ease/In` | `cubic-bezier(0.64, 0, 0.78, 0)` |
| `Ease/Pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `Ease/Dough` | `cubic-bezier(0.3, 1.42, 0.52, 1)` |

### Motion transforms

| Token | Value |
|---|---:|
| Press scale | `0.96` |
| Enter scale | `0.94` |
| Enter rotation | `3°` |
| Motion distance XS | `6 px` |
| Motion distance SM | `12 px` |
| Motion distance MD | `24 px` |
| Motion distance LG | `48 px` |

Reduced motion keeps the same content and interactions while setting choreography durations to approximately zero and transform distances, scale changes, and rotation to neutral values.

Implementation note: `src/styles/motion.css` currently references `--ease-spring` and `--ease-in-out`, but neither alias is declared in `tokens.css`. They are not part of this canonical token set until the runtime definitions are normalized.

## 7. Layering

| Layer | Z-index |
|---|---:|
| Texture | `2` |
| Scene | `10` |
| Header | `20` |
| Floating UI | `30` |
| Overlay | `40` |
| Sheet | `50` |
| Toast | `60` |
| Desktop gate | `70` |
| Rotate lock | `80` |
| Preloader | `90` |
| Skip link | `100` |

## 8. Recommended Figma Organization

Create these variable collections and style groups:

1. `Color` — Brand, Surface, Text, Interactive, Border, Overlay, State, and Accent.
2. `Number` — Space, Radius, Border, Target Size, and layout dimensions.
3. `Typography` — Display, Heading, Body, and UI text styles.
4. `Effects` — Shadow SM, MD, LG, and Focus.
5. `Motion Notes` — duration and easing references for prototype transitions.

Build wireframes at `390 × 844 px`. Use Auto Layout, the spacing variables above, a `17 px` page gutter, and a minimum `44 px` interactive target. Test the finished design at approximately `360 × 780` and `428 × 926` without creating a separate visual system for either size.
