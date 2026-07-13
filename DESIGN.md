# Design System

## Color Palette

Extracted from the admin UI. Use these TailwindCSS utility classes throughout the app.

### Backgrounds
| Token | Hex | Tailwind |
|-------|-----|----------|
| background | `#E9E4DA` | `bg-background` |
| surface | `#FCFAF6` | `bg-surface` |
| white | `#FFFFFF` | `bg-white` |

### Text
| Token | Hex | Tailwind |
|-------|-----|----------|
| text-primary | `#1C1815` | `text-text-primary` |
| text-secondary | `#4A443B` | `text-text-secondary` |
| text-muted | `#8B7F6E` | `text-text-muted` |

### Borders
| Token | Hex | Tailwind |
|-------|-----|----------|
| border | `#E2DACA` | `border-border` |
| border-subtle | `#D3CABA` | `border-border-subtle` |

### Accent (Gold)
| Token | Hex | Tailwind |
|-------|-----|----------|
| accent | `#B8935F` | `bg-accent` / `text-accent` |
| accent-light | `#C9AD7F` | `bg-accent-light` |
| accent-surface | `#FBF6EA` | `bg-accent-surface` |
| accent-hover | `#F7EFDB` | `bg-accent-hover` |

### Text on Accent
| Token | Hex | Tailwind |
|-------|-----|----------|
| text-on-accent | `#6B5D3F` | `text-text-on-accent` |
| text-on-accent-muted | `#96876A` | `text-text-on-accent-muted` |

### Dark
| Token | Hex | Tailwind |
|-------|-----|----------|
| dark | `#1C1815` | `bg-dark` |
| dark-text | `#F7F3ED` | `text-dark-text` |

### Semantic
| Token | Hex | Tailwind |
|-------|-----|----------|
| success | `#7A9B7E` | `text-success` / `bg-success` |

## Typography

- **Font stack**: `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`
- **Page title**: 20px, font-weight 600
- **Card title**: 14.5px, font-weight 600
- **Body/labels**: 12-13px, font-weight 500

## Spacing & Radius

- **Card padding**: 20px
- **Card border-radius**: 14px
- **Input/button border-radius**: 10-12px
- **Dropzone border-radius**: 12px

## Components

### Card
```html
<div class="bg-surface border border-border rounded-[14px] p-5">
```

### Dropzone
```html
<label class="border-[1.5px] border-dashed border-accent-light bg-accent-surface rounded-xl cursor-pointer hover:border-accent hover:bg-accent-hover transition-colors">
```

### Ghost Button
```html
<button class="border border-border-subtle rounded-[10px] px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-accent-hover">
```

### CTA Button
```html
<button class="bg-dark text-dark-text rounded-xl px-6 py-3.5 text-sm font-medium">
```

### Toast
```html
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-dark-text rounded-full px-5 py-3 text-sm flex items-center gap-2">
  <span class="text-success">✓</span>
</div>
```
