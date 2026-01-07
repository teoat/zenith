/**
 * Keyboard shortcuts configuration for the application
 */

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Cases Page
  {
    key: "Tab",
    description: "Focus first case in Kanban view",
    category: "Cases",
  },
  {
    key: "↑/↓",
    description: "Navigate between cases in Kanban view",
    category: "Cases",
  },
  {
    key: "←/→",
    description: "Navigate between Kanban columns",
    category: "Cases",
  },
  {
    key: "Enter",
    description: "Open selected case details",
    category: "Cases",
  },
  {
    key: "Esc",
    description: "Clear case selection/focus",
    category: "Cases",
  },

  // Investigation Page
  {
    key: "Ctrl+R / Cmd+R",
    description: "Reset investigation graph",
    category: "Investigation",
  },
  {
    key: "Ctrl+S / Cmd+S",
    description: "Save graph snapshot",
    category: "Investigation",
  },

  // Network Graph
  {
    key: "Tab",
    description: "Cycle through graph nodes",
    category: "Network Graph",
  },
  {
    key: "→/↓",
    description: "Move to adjacent node",
    category: "Network Graph",
  },
  {
    key: "Enter / Space",
    description: "Select focused node",
    category: "Network Graph",
  },
  {
    key: "Esc",
    description: "Clear node focus",
    category: "Network Graph",
  },

  // General
  {
    key: "?",
    description: "Show keyboard shortcuts",
    category: "General",
  },
  {
    key: "Esc",
    description: "Close modals and dialogs",
    category: "General",
  },
];
