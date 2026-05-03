# OmniPlan-JS UI Design Specification

## Design Philosophy: Cyberpunk Minimalist

> "Less chrome, more data. Every pixel must justify its existence through information density or emotional resonance."

**Core principles:**
- **Surface as canvas** — #121212 is the void. Cards float on it via glassmorphism, not elevation.
- **Color is signal** — cyber-blue only for primary actions and active states. neon-green exclusively for completion. danger-red reserved for irreversible actions and time pressure.
- **Motion is meaning** — animations encode system state. No decorative transitions. Every motion answers "what happened to my data?"
- **Typography as tooling** — Inter for body (readability), JetBrains Mono for metrics/dates/IDs (precision, machine-readability).

---

## 1. Visual Language

### 1.1 Color System

| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#121212` | Page background, deepest layer |
| `surface-card` | `rgba(30,30,30,0.6)` | Glass cards — translucent, backdrop-blurred |
| `surface-elevated` | `rgba(40,40,40,0.7)` | Hover/focus states, dropdowns |
| `cyber-blue` | `#00d4ff` | Primary CTA, active filter, selection border, pulse |
| `neon-green` | `#39ff14` | Completion, success, done status |
| `danger-red` | `#ff4444` | Delete, overdue, error rollback |
| `amber` | `#f59e0b` | Elapsed time, warnings, time pressure |
| `border-subtle` | `rgba(255,255,255,0.06)` | Card borders, grid lines |
| `border-active` | `rgba(0,212,255,0.3)` | Selected/focused borders |

### 1.2 Glassmorphism Specification

```css
.glass-card {
  background: rgba(30, 30, 30, 0.55);
  backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}
.glass-card:hover {
  background: rgba(35, 35, 35, 0.65);
  border-color: rgba(0, 212, 255, 0.15);
}
```

### 1.3 Typography

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Page titles | Inter | 700 | 28px/1.2 |
| Card titles | Inter | 600 | 18px/1.3 |
| Body text | Inter | 400 | 14px/1.5 |
| Metrics / IDs / Code | JetBrains Mono | 500 | 13px/1.4 |
| Status labels | JetBrains Mono | 600 | 11px/1.0 |

### 1.4 Micro-interactions

**RGB Pulse (WebSocket status indicator)**
A 4px circle in navbar right, breathing animation:
- `connected` → steady cyber-blue glow, `box-shadow: 0 0 6px #00d4ff`
- `reconnecting` → amber pulse, expanding ring every 2s
- `disconnected` → dim gray, no animation

**Optimistic Update Feedback**
When a task is modified via inline edit:
1. Cell border flashes `cyber-blue` for 600ms (local state committed)
2. On API success → border fades to transparent (confirmation)
3. On API error → cell shakes horizontally (4px amplitude, 3 oscillations over 400ms), then border flashes `danger-red`

**Card Hover Lift**
Glass cards lift 2px and increase glow — no shadow, just border brightness shift.

---

## 2. Page Layouts

### 2.1 ProjectList (Home)
```
┌─────────────────────────────────────────────┐
│  [Pulse]  Projects                [+ New]   │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Project  │  │ Project  │  │ Project  │  │
│  │  Card    │  │  Card    │  │  Card    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  [▼ Show Master Timeline]                   │
│  ┌───────────────────────────────────────┐  │
│  │  ██ Project A ████  ◆  ██████        │  │
│  │  ██ Project B    ████████  ◆         │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 ProjectDetail (Dashboard)
```
┌─────────────────────────────────────────────┐
│  ← Back   ● Project Name   [Timeline][Tasks]│
├─────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ╭─100%─╮ │ │ ╭──60%─╮│ │ ╭───0%─╮│    │
│  │ │Done  │ │ │ │Active│ │ │ │ Todo │ │    │
│  │ ╰──────╯ │ │ ╰──────╯│ │ ╰──────╯│    │
│  │  12/12   │ │   8/14   │ │   0/5    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  Goals                          [+ Add Goal]│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Goal A   │  │ Goal B   │  │ Goal C   │  │
│  │ ████ 75% │  │ ██ 30%   │  │ ██ 50%   │  │
│  │ [prio▼]  │  │ [prio▼]  │  │ [prio▼]  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

The dashboard cards at top show goal-level metrics as glowing ring progress bars:
- **On Track**: ≥ 80% completion, ring pulse → green
- **At Risk**: < 80%, > 0%, ring → amber
- **Stalled**: 0% tasks done, ring → dim gray

### 2.3 TaskView (Task Table + Filter Drawer)
```
┌─────────────────────────────────────────────┐
│  ← Back  Goal Name         [Filters ▸]      │
├─────────────────────────────────────────────┤
│  Milestones                                 │
│  ◆ Draft Complete  05-15  [pending ▼] [✕]   │
│  ◆ Client Delivery  05-30  [pending ▼] [✕]  │
│  [+ Add Milestone]                          │
├─────────────────────────────────────────────┤
│  [+ Add Task]                               │
│  ┌──────────────────────────────────────┐   │
│  │ 2026-05-04                            │   │
│  │  Task │ Status │ Priority │ Start │… │   │
│  │  ──── │ ────── │ ──────── │ ───── │  │   │
│  │  Foo  │  todo▼ │  high    │ 05-04 │  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌─ Filter Drawer (slide from right) ───┐  │
│  │  Status: [todo ▼]                     │  │
│  │  Priority: [all ▼]                    │  │
│  │  Start Date: [__/__/____]             │  │
│  │  [Apply] [Reset]                      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

Filter drawer slides in from right with `framer-motion` AnimatePresence. Glass background with backdrop-blur. No top-mounted bulky dropdowns.

### 2.4 Timeline (Gantt)
```
┌─────────────────────────────────────────────┐
│  ← Back     Timeline     [Zoom: 1M|2W|1W]   │
├─────────────────────────────────────────────┤
│            Apr              May              │
│  28 29 30 01 02 03 04 05 06 07 08 09 10    │
│  ───────────────────────────────────────    │
│  Proj A                                    │
│  ████████████                              │
│  ◆                                         │
│  Proj B                                    │
│       ████████████                         │
│            ◆                               │
│                                             │
│  Milestones                                 │
│  ◆ Draft Complete  05-15  completed    [✕]  │
└─────────────────────────────────────────────┘
```

Bars use framer-motion `layoutId` for smooth re-render on data change. Zoom controls adjust column width (day/week/month granularity).

---

## 3. Component Implementation: ProjectCard

The ProjectCard is the hero component of the home screen. It embodies glassmorphism, micro-interactions, and cyberpunk aesthetics.

```tsx
// packages/web/src/components/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  color: string;
  updated_at: string;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export function ProjectCard({ id, name, description, color, updated_at, onDelete }: ProjectCardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timeAgo = getTimeAgo(updated_at);

  return (
    <Link
      to={`/projects/${id}`}
      className="
        group relative block
        bg-surface-card/60 backdrop-blur-xl
        border border-white/5
        rounded-xl p-5
        transition-all duration-300 ease-out
        hover:bg-surface-elevated/70
        hover:border-cyber-blue/20
        hover:-translate-y-0.5
      "
    >
      {/* Subtle glow on hover — only right edge */}
      <div className="
        absolute inset-0 rounded-xl opacity-0
        group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-r from-transparent via-transparent to-cyber-blue/5
        pointer-events-none
      " />

      {/* Delete button — appears on hover */}
      {isAuthenticated && (
        <button
          onClick={(e) => onDelete(e, id, name)}
          className="
            absolute top-3 right-3 z-10
            text-white/20 hover:text-danger-red
            text-sm leading-none
            opacity-0 group-hover:opacity-100
            transition-all duration-200
            hover:scale-110
          "
          title="Delete project"
        >
          &#x2715;
        </button>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
          style={{ backgroundColor: color }}
        />
        <h3 className="
          text-lg font-semibold text-white/90
          group-hover:text-cyber-blue
          transition-colors duration-200
          truncate
          font-['Inter']
        ">
          {name}
        </h3>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-white/40 line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-xs font-mono text-white/25">
        <span>{id.slice(0, 8)}</span>
        <span>{timeAgo}</span>
      </div>
    </Link>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
```

---

## 4. Extended tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00d4ff',
          'blue-glow': 'rgba(0, 212, 255, 0.15)',
        },
        neon: {
          green: '#39ff14',
        },
        danger: {
          red: '#ff4444',
        },
        amber: {
          DEFAULT: '#f59e0b',
        },
        surface: {
          DEFAULT: '#121212',
          card: 'rgba(30, 30, 30, 0.55)',
          elevated: 'rgba(40, 40, 40, 0.70)',
          divider: 'rgba(255, 255, 255, 0.06)',
        },
        text: {
          primary: 'rgba(255, 255, 255, 0.90)',
          secondary: 'rgba(255, 255, 255, 0.55)',
          muted: 'rgba(255, 255, 255, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      animation: {
        'pulse-connect': 'pulseConnect 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'glow-border': 'glowBorder 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        pulseConnect: {
          '0%, 100%': {
            boxShadow: '0 0 4px rgba(0, 212, 255, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.8), 0 0 24px rgba(0, 212, 255, 0.3)',
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        glowBorder: {
          '0%': { borderColor: '#00d4ff', boxShadow: '0 0 8px rgba(0, 212, 255, 0.3)' },
          '100%': { borderColor: 'transparent', boxShadow: 'none' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 8px rgba(0, 212, 255, 0.2)',
        'glow-green': '0 0 8px rgba(57, 255, 20, 0.2)',
        'glow-red': '0 0 8px rgba(255, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
};
```

---

## 5. Interaction Specifications

### 5.1 WebSocket Pulse Indicator

Located in Navbar top-right. A 6px circle with states:

| State | CSS Class | Visual |
|-------|-----------|--------|
| Connected | `animate-pulse-connect bg-cyber-blue` | Steady blue pulse glow |
| Reconnecting | `animate-pulse bg-amber-400` | Slow amber blink |
| Disconnected | `bg-white/10` | Dim, static |

### 5.2 Optimistic Update Feedback

When an inline edit commits (TaskView):

**Phase 1: Local Optimism (0-600ms)**
```css
.cell-optimistic {
  animation: glowBorder 0.6s ease-out forwards;
}
```
Cell border flashes cyber-blue, then fades.

**Phase 2: Server Confirmation (API response)**
- Success: Cell becomes static again, toast "Saved" in neon-green.
- Error: Cell shakes:
```css
.cell-error {
  animation: shake 0.4s ease-in-out;
  border-color: #ff4444;
}
```
Toast shows error message. Cell value reverts to previous state.

### 5.3 Offline / Disconnection Warning

Replaces the yellow banner. A non-intrusive system-level indicator:

```
┌──────────────────────────────────────────┐
│  ⚡ Connection Lost — retrying in 5s      │  ← single thin line, glass background
└──────────────────────────────────────────┘
```

Appears as a 32px tall bar at the very top, above Navbar. Background: `rgba(255, 68, 68, 0.08)` with `border-b border-danger-red/20`. Text: JetBrains Mono, 11px, centered. Countdown decrements.

### 5.4 Card Interaction States

| State | Visual |
|-------|--------|
| Rest | `bg-surface-card/60`, `border-white/5` |
| Hover | `bg-surface-elevated/70`, `border-cyber-blue/20`, `-translate-y-0.5` |
| Active (click) | `scale-[0.98]` for 100ms, then spring back |
| Deleting | `opacity-50`, then slide left 100px and disappear (300ms) |

---

## 6. Ring Progress Component (Dashboard)

For the ProjectDetail dashboard cards showing goal completion:

```
         ╭──────╮
        ╱  75%  ╲
       │  ████   │    ← ring = conic-gradient with neon-green up to percentage
        ╲        ╱
         ╰──────╯
          12/16
```

Implemented as a 64px SVG circle with `stroke-dasharray` animation. The ring color is:
- `≥ 80%` → neon-green
- `> 0%, < 80%` → amber gradient
- `= 0%` → white/10 (dim)

The count `12/16` below uses JetBrains Mono for precision feel.
