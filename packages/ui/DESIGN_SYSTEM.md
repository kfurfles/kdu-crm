# Design System

Este documento define todas as regras de design tokens e foundations do sistema.  
Baseado no Untitled UI Design System, adaptado com verde #05603A como cor principal.

---

## Índice

1. [Cores](#cores)
   - [Brand (Verde)](#brand-verde)
   - [Gray Scale](#gray-scale)
   - [Semantic Colors](#semantic-colors)
   - [Component Tokens](#component-tokens)
2. [Tipografia](#tipografia)
   - [Font Family](#font-family)
   - [Font Sizes](#font-sizes)
   - [Font Weights](#font-weights)
   - [Line Heights](#line-heights)
   - [Letter Spacing](#letter-spacing)
   - [Text Styles](#text-styles)
3. [Espaçamento](#espaçamento)
   - [Spacing Scale](#spacing-scale)
   - [Padding Patterns](#padding-patterns)
   - [Gap Patterns](#gap-patterns)
4. [Sombras](#sombras)
5. [Border Radius](#border-radius)
6. [Bordas](#bordas)
7. [Animações](#animações)
8. [Estados](#estados)
9. [Breakpoints](#breakpoints)
10. [Z-Index](#z-index)

---

## Cores

### Brand (Verde)

Paleta principal do sistema baseada em #05603A (Success/700 do Untitled UI).

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| `brand-50` | `#ECFDF3` | rgb(236, 253, 243) | Backgrounds sutis, hover states |
| `brand-100` | `#D1FADF` | rgb(209, 250, 223) | Backgrounds secundários, selected states |
| `brand-200` | `#A6F4C5` | rgb(166, 244, 197) | Borders suaves, dividers |
| `brand-300` | `#6CE9A6` | rgb(108, 233, 166) | Borders, focus rings |
| `brand-400` | `#32D583` | rgb(50, 213, 131) | Icons, decorativos |
| `brand-500` | `#12B76A` | rgb(18, 183, 106) | Texto secundário, links hover |
| `brand-600` | `#039855` | rgb(3, 152, 85) | Botões hover, elementos interativos |
| `brand-700` | `#05603A` | rgb(5, 96, 58) | **Principal** - Botões, links, accent |
| `brand-800` | `#054F31` | rgb(5, 79, 49) | Pressed states, texto escuro |
| `brand-900` | `#053321` | rgb(5, 51, 33) | Texto máximo contraste |

**Uso no CSS:**
```css
/* Variáveis CSS */
--brand-50: #ECFDF3;
--brand-100: #D1FADF;
--brand-200: #A6F4C5;
--brand-300: #6CE9A6;
--brand-400: #32D583;
--brand-500: #12B76A;
--brand-600: #039855;
--brand-700: #05603A;
--brand-800: #054F31;
--brand-900: #053321;
```

**Uso no Tailwind:**
```html
<button class="bg-brand-700 hover:bg-brand-800 text-white">
  Primary Button
</button>
```

---

### Gray Scale

Escala de cinzas do Untitled UI para elementos neutros.

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| `gray-50` | `#FAFAFA` | rgb(250, 250, 250) | Backgrounds de página |
| `gray-100` | `#F5F5F5` | rgb(245, 245, 245) | Backgrounds de seções, cards hover |
| `gray-200` | `#E9EAEB` | rgb(233, 234, 235) | Borders, dividers |
| `gray-300` | `#D5D7DA` | rgb(213, 215, 218) | Input borders, disabled borders |
| `gray-400` | `#A4A7AE` | rgb(164, 167, 174) | Placeholder text, icons disabled |
| `gray-500` | `#717680` | rgb(113, 118, 128) | Placeholder, texto terciário |
| `gray-600` | `#535862` | rgb(83, 88, 98) | Texto secundário, labels |
| `gray-700` | `#414651` | rgb(65, 70, 81) | Texto principal secundário |
| `gray-800` | `#252B37` | rgb(37, 43, 55) | Texto principal |
| `gray-900` | `#181D27` | rgb(24, 29, 39) | Headings, texto máximo contraste |

**Uso no CSS:**
```css
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E9EAEB;
--gray-300: #D5D7DA;
--gray-400: #A4A7AE;
--gray-500: #717680;
--gray-600: #535862;
--gray-700: #414651;
--gray-800: #252B37;
--gray-900: #181D27;
```

---

### Semantic Colors

Cores com significado específico para feedback e estados.

#### Error / Destructive
| Token | Hex | Uso |
|-------|-----|-----|
| `error-50` | `#FEF3F2` | Background de alerta |
| `error-100` | `#FEE4E2` | Background hover |
| `error-200` | `#FECDCA` | Border suave |
| `error-300` | `#FDA29B` | Border |
| `error-400` | `#F97066` | Icon |
| `error-500` | `#F04438` | Texto |
| `error-600` | `#D92D20` | **Principal** |
| `error-700` | `#B42318` | Hover |
| `error-800` | `#912018` | Pressed |
| `error-900` | `#7A271A` | Texto escuro |

#### Warning
| Token | Hex | Uso |
|-------|-----|-----|
| `warning-50` | `#FFFAEB` | Background de alerta |
| `warning-100` | `#FEF0C7` | Background hover |
| `warning-200` | `#FEDF89` | Border suave |
| `warning-300` | `#FEC84B` | Border |
| `warning-400` | `#FDB022` | Icon |
| `warning-500` | `#F79009` | **Principal** |
| `warning-600` | `#DC6803` | Hover |
| `warning-700` | `#B54708` | Pressed |
| `warning-800` | `#93370D` | Texto escuro |
| `warning-900` | `#7A2E0E` | Texto máximo |

#### Success
(Usa a mesma paleta do Brand)
| Token | Hex | Uso |
|-------|-----|-----|
| `success-50` | `#ECFDF3` | Background |
| `success-500` | `#12B76A` | Texto |
| `success-600` | `#039855` | **Principal** |
| `success-700` | `#05603A` | Hover |

#### Info / Blue
| Token | Hex | Uso |
|-------|-----|-----|
| `info-50` | `#EFF8FF` | Background |
| `info-500` | `#2E90FA` | Texto |
| `info-600` | `#1570EF` | **Principal** |
| `info-700` | `#175CD3` | Hover |

---

### Component Tokens

Tokens semânticos para componentes (Light Mode).

```css
:root {
  /* Backgrounds */
  --background: var(--gray-50);           /* Página */
  --card: #FFFFFF;                         /* Cards */
  --popover: #FFFFFF;                      /* Popovers, dropdowns */
  --muted: var(--gray-100);               /* Elementos desabilitados */
  --accent: var(--brand-50);              /* Destaque sutil */

  /* Foregrounds (texto) */
  --foreground: var(--gray-900);          /* Texto principal */
  --card-foreground: var(--gray-900);     /* Texto em cards */
  --popover-foreground: var(--gray-900);  /* Texto em popovers */
  --muted-foreground: var(--gray-500);    /* Texto secundário */
  --accent-foreground: var(--brand-700);  /* Texto accent */

  /* Primary */
  --primary: var(--brand-700);            /* Botões, links */
  --primary-foreground: #FFFFFF;          /* Texto em primary */

  /* Secondary */
  --secondary: var(--gray-100);           /* Botões secundários */
  --secondary-foreground: var(--gray-700);

  /* Destructive */
  --destructive: #D92D20;
  --destructive-foreground: #FFFFFF;

  /* Borders */
  --border: var(--gray-200);              /* Borders gerais */
  --input: var(--gray-300);               /* Input borders */
  --ring: var(--brand-500);               /* Focus rings */
}
```

**Dark Mode:**
```css
.dark {
  --background: var(--gray-900);
  --card: var(--gray-800);
  --popover: var(--gray-800);
  --muted: var(--gray-700);
  --accent: var(--brand-900);

  --foreground: var(--gray-50);
  --card-foreground: var(--gray-50);
  --popover-foreground: var(--gray-50);
  --muted-foreground: var(--gray-400);
  --accent-foreground: var(--brand-400);

  --primary: var(--brand-500);
  --primary-foreground: var(--gray-900);

  --secondary: var(--gray-700);
  --secondary-foreground: var(--gray-100);

  --border: var(--gray-700);
  --input: var(--gray-600);
  --ring: var(--brand-400);
}
```

---

## Tipografia

### Font Family

```css
--font-sans: "Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
```

**Uso:**
- `font-sans` - Todo o texto da interface
- `font-mono` - Código, dados técnicos

---

### Font Sizes

| Token | Size | Line Height | Uso |
|-------|------|-------------|-----|
| `text-xs` | 12px | 18px (1.5) | Labels pequenos, captions |
| `text-sm` | 14px | 20px (1.43) | Corpo secundário, inputs |
| `text-base` | 16px | 24px (1.5) | Corpo principal |
| `text-lg` | 18px | 28px (1.56) | Subtítulos |
| `text-xl` | 20px | 30px (1.5) | Títulos de seção |
| `text-2xl` | 24px | 32px (1.33) | Títulos de página |
| `text-3xl` | 30px | 38px (1.27) | Display small |
| `text-4xl` | 36px | 44px (1.22) | Display medium |
| `text-5xl` | 48px | 60px (1.25) | Display large |
| `text-6xl` | 60px | 72px (1.2) | Display XL |

---

### Font Weights

| Token | Weight | Uso |
|-------|--------|-----|
| `font-normal` | 400 | Corpo de texto |
| `font-medium` | 500 | Labels, textos de ênfase leve |
| `font-semibold` | 600 | Botões, headings |
| `font-bold` | 700 | Headings principais |

---

### Line Heights

| Token | Value | Uso |
|-------|-------|-----|
| `leading-none` | 1 | Apenas números grandes |
| `leading-tight` | 1.25 | Headings |
| `leading-snug` | 1.375 | Subtítulos |
| `leading-normal` | 1.5 | Corpo de texto |
| `leading-relaxed` | 1.625 | Texto longo |
| `leading-loose` | 2 | Espaçamento extra |

---

### Letter Spacing

| Token | Value | Uso |
|-------|-------|-----|
| `tracking-tighter` | -0.05em | Display text grande |
| `tracking-tight` | -0.025em | Headings |
| `tracking-normal` | 0 | Corpo de texto |
| `tracking-wide` | 0.025em | Buttons, labels uppercase |
| `tracking-wider` | 0.05em | Small caps |

---

### Text Styles

Combinações predefinidas:

```css
/* Display */
.display-2xl { font-size: 72px; line-height: 90px; font-weight: 600; letter-spacing: -0.02em; }
.display-xl  { font-size: 60px; line-height: 72px; font-weight: 600; letter-spacing: -0.02em; }
.display-lg  { font-size: 48px; line-height: 60px; font-weight: 600; letter-spacing: -0.02em; }
.display-md  { font-size: 36px; line-height: 44px; font-weight: 600; letter-spacing: -0.02em; }
.display-sm  { font-size: 30px; line-height: 38px; font-weight: 600; }
.display-xs  { font-size: 24px; line-height: 32px; font-weight: 600; }

/* Text */
.text-xl    { font-size: 20px; line-height: 30px; }
.text-lg    { font-size: 18px; line-height: 28px; }
.text-md    { font-size: 16px; line-height: 24px; }
.text-sm    { font-size: 14px; line-height: 20px; }
.text-xs    { font-size: 12px; line-height: 18px; }

/* Variantes de peso */
.text-sm-regular   { font-size: 14px; line-height: 20px; font-weight: 400; }
.text-sm-medium    { font-size: 14px; line-height: 20px; font-weight: 500; }
.text-sm-semibold  { font-size: 14px; line-height: 20px; font-weight: 600; }
```

---

## Espaçamento

### Spacing Scale

Base unit: **4px**

| Token | Value | Pixels | Uso |
|-------|-------|--------|-----|
| `0` | 0 | 0px | Reset |
| `0.5` | 0.125rem | 2px | Micro ajustes |
| `1` | 0.25rem | 4px | Ícones inline |
| `1.5` | 0.375rem | 6px | Gaps pequenos |
| `2` | 0.5rem | 8px | Padding interno pequeno |
| `2.5` | 0.625rem | 10px | - |
| `3` | 0.75rem | 12px | Padding de inputs |
| `3.5` | 0.875rem | 14px | - |
| `4` | 1rem | 16px | Padding padrão |
| `5` | 1.25rem | 20px | Gap entre elementos |
| `6` | 1.5rem | 24px | Padding de cards |
| `7` | 1.75rem | 28px | - |
| `8` | 2rem | 32px | Seções pequenas |
| `9` | 2.25rem | 36px | - |
| `10` | 2.5rem | 40px | Gap de seções |
| `11` | 2.75rem | 44px | - |
| `12` | 3rem | 48px | Seções médias |
| `14` | 3.5rem | 56px | - |
| `16` | 4rem | 64px | Seções grandes |
| `20` | 5rem | 80px | Container margins |
| `24` | 6rem | 96px | Hero sections |
| `28` | 7rem | 112px | - |
| `32` | 8rem | 128px | Espaços maiores |

---

### Padding Patterns

**Componentes:**
| Componente | Padding | Valor |
|------------|---------|-------|
| Button SM | `py-2 px-3` | 8px 12px |
| Button MD | `py-2.5 px-4` | 10px 16px |
| Button LG | `py-3 px-5` | 12px 20px |
| Input | `py-2.5 px-3.5` | 10px 14px |
| Card | `p-6` | 24px |
| Modal | `p-6` | 24px |
| Table Cell | `py-4 px-6` | 16px 24px |
| Badge | `py-0.5 px-2.5` | 2px 10px |

---

### Gap Patterns

| Contexto | Gap | Valor |
|----------|-----|-------|
| Inline items (icon + text) | `gap-2` | 8px |
| Form fields | `gap-1.5` | 6px |
| Stacked items | `gap-4` | 16px |
| Cards grid | `gap-6` | 24px |
| Sections | `gap-8` | 32px |
| Page sections | `gap-16` | 64px |

---

## Sombras

Seguindo o padrão Untitled UI - sombras sutis e profissionais.

| Token | Value | Uso |
|-------|-------|-----|
| `shadow-xs` | `0px 1px 2px rgba(10, 13, 18, 0.05)` | Inputs, buttons |
| `shadow-sm` | `0px 1px 2px rgba(10, 13, 18, 0.06), 0px 1px 3px rgba(10, 13, 18, 0.1)` | Cards elevados |
| `shadow-md` | `0px 2px 4px -2px rgba(10, 13, 18, 0.06), 0px 4px 8px -2px rgba(10, 13, 18, 0.1)` | Dropdowns |
| `shadow-lg` | `0px 4px 6px -2px rgba(10, 13, 18, 0.03), 0px 12px 16px -4px rgba(10, 13, 18, 0.08)` | Modals |
| `shadow-xl` | `0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08)` | Popovers grandes |
| `shadow-2xl` | `0px 24px 48px -12px rgba(10, 13, 18, 0.18)` | Overlays |

**CSS:**
```css
--shadow-xs: 0px 1px 2px 0px rgba(10, 13, 18, 0.05);
--shadow-sm: 0px 1px 2px 0px rgba(10, 13, 18, 0.06), 0px 1px 3px 0px rgba(10, 13, 18, 0.1);
--shadow-md: 0px 2px 4px -2px rgba(10, 13, 18, 0.06), 0px 4px 8px -2px rgba(10, 13, 18, 0.1);
--shadow-lg: 0px 4px 6px -2px rgba(10, 13, 18, 0.03), 0px 12px 16px -4px rgba(10, 13, 18, 0.08);
--shadow-xl: 0px 8px 8px -4px rgba(10, 13, 18, 0.03), 0px 20px 24px -4px rgba(10, 13, 18, 0.08);
--shadow-2xl: 0px 24px 48px -12px rgba(10, 13, 18, 0.18);
```

---

## Border Radius

| Token | Value | Uso |
|-------|-------|-----|
| `rounded-none` | 0 | Sharp edges |
| `rounded-sm` | 4px | Badges, chips pequenos |
| `rounded` | 6px | Checkboxes, toggles |
| `rounded-md` | 6px | Inputs, selects |
| `rounded-lg` | 8px | Buttons, cards |
| `rounded-xl` | 12px | Modals, cards grandes |
| `rounded-2xl` | 16px | Containers hero |
| `rounded-3xl` | 24px | Pills, elementos decorativos |
| `rounded-full` | 9999px | Avatars, badges circulares |

**Base radius:**
```css
--radius: 0.5rem; /* 8px - usado como base */
--radius-sm: calc(var(--radius) - 4px);  /* 4px */
--radius-md: calc(var(--radius) - 2px);  /* 6px */
--radius-lg: var(--radius);               /* 8px */
--radius-xl: calc(var(--radius) + 4px);  /* 12px */
--radius-2xl: calc(var(--radius) + 8px); /* 16px */
```

---

## Bordas

### Border Width
| Token | Value | Uso |
|-------|-------|-----|
| `border` | 1px | Padrão |
| `border-2` | 2px | Ênfase, focus |

### Border Color
| Token | Color | Uso |
|-------|-------|-----|
| `border-border` | `var(--gray-200)` | Borders gerais |
| `border-input` | `var(--gray-300)` | Input borders |
| `border-primary` | `var(--brand-600)` | Focus, selected |
| `border-destructive` | `var(--error-600)` | Erros |

---

## Animações

### Durations
| Token | Value | Uso |
|-------|-------|-----|
| `duration-75` | 75ms | Micro-interações |
| `duration-100` | 100ms | Hover rápido |
| `duration-150` | 150ms | **Padrão** - hover, focus |
| `duration-200` | 200ms | Transições médias |
| `duration-300` | 300ms | Modais, dropdowns |
| `duration-500` | 500ms | Animações lentas |

### Easing
| Token | Value | Uso |
|-------|-------|-----|
| `ease-linear` | linear | Progress bars |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | **Entry animations** |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Transições gerais |

### Padrões de animação
```css
/* Hover padrão */
transition: all 150ms ease-out;

/* Modal entry */
transition: opacity 300ms ease-out, transform 300ms ease-out;

/* Dropdown */
transition: opacity 200ms ease-out, transform 200ms ease-out;
```

---

## Estados

### Interactive States

Todo elemento interativo deve ter:

| Estado | Descrição | Exemplo |
|--------|-----------|---------|
| **Default** | Estado inicial | `bg-brand-700` |
| **Hover** | Mouse sobre | `bg-brand-800` |
| **Focus** | Foco via teclado | `ring-4 ring-brand-100 border-brand-500` |
| **Active/Pressed** | Clicando | `bg-brand-900` |
| **Disabled** | Desabilitado | `opacity-50 cursor-not-allowed` |
| **Loading** | Carregando | Spinner + disabled |

### Data States

| Estado | Descrição | Visual |
|--------|-----------|--------|
| **Empty** | Sem dados | Ilustração + texto + CTA |
| **Loading** | Carregando | Skeleton ou spinner |
| **Error** | Erro | Mensagem vermelha + retry |
| **Success** | Sucesso | Toast verde |

### Form States

| Estado | Descrição | Visual |
|--------|-----------|--------|
| **Default** | Normal | `border-gray-300` |
| **Focus** | Focado | `border-brand-500 ring-4 ring-brand-100` |
| **Error** | Inválido | `border-error-500 ring-4 ring-error-100` |
| **Disabled** | Desabilitado | `bg-gray-50 text-gray-500` |
| **Readonly** | Somente leitura | `bg-gray-50 cursor-default` |

---

## Breakpoints

| Token | Min Width | Uso |
|-------|-----------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

**Container widths:**
| Breakpoint | Max Width |
|------------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## Z-Index

| Token | Value | Uso |
|-------|-------|-----|
| `z-0` | 0 | Base |
| `z-10` | 10 | Elementos elevados |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Fixed headers |
| `z-40` | 40 | Sidebars overlay |
| `z-50` | 50 | Modals |
| `z-[60]` | 60 | Toasts |
| `z-[70]` | 70 | Tooltips |
| `z-[9999]` | 9999 | Dev tools |

---

## Referência Rápida - Componentes

### Buttons

```tsx
// Primary
<button className="bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors duration-150">
  Button
</button>

// Secondary
<button className="bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold px-4 py-2.5 rounded-lg border border-gray-300 shadow-xs transition-colors duration-150">
  Button
</button>

// Destructive
<button className="bg-error-600 hover:bg-error-700 active:bg-error-800 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors duration-150">
  Delete
</button>
```

### Inputs

```tsx
// Default
<input className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-xs text-gray-900 text-sm placeholder:text-gray-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none transition-all duration-150" />

// Error
<input className="w-full h-10 px-3.5 py-2.5 bg-white border border-error-500 rounded-lg shadow-xs text-gray-900 text-sm focus:ring-4 focus:ring-error-100 focus:outline-none" />
```

### Cards

```tsx
<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
  {/* content */}
</div>
```

### Badges

```tsx
// Success
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
  Active
</span>

// Error
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-50 text-error-700 border border-error-200">
  Cancelled
</span>
```

---

## Arquivos de Referência

- **Tokens CSS:** `packages/ui/src/styles/globals.css`
- **Componentes:** `packages/ui/src/components/ui/`
- **Storybook:** `packages/ui/stories/`

---

*Última atualização: Janeiro 2026*
*Baseado em: Untitled UI Design System v2.0*
