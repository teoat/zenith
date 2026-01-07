// ARIA utilities and helpers for accessibility compliance
export class AriaHelpers {
  generateAriaId(prefix = "aria") {
    return `${prefix}-${Date.now()}-${Date.now().toString(36)}`;
  }

  setAriaExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute("aria-expanded", expanded.toString());
  }

  setAriaHidden(element: HTMLElement, hidden: boolean) {
    element.setAttribute("aria-hidden", hidden.toString());
  }

  // ARIA attribute builders
  aria = {
    expanded: (expanded: boolean) => ({ "aria-expanded": expanded }),
    hidden: (hidden: boolean) => ({ "aria-hidden": hidden }),
    label: (label: string) => ({ "aria-label": label }),
    labelledBy: (id: string) => ({ "aria-labelledby": id }),
    describedBy: (id: string) => ({ "aria-describedby": id }),
    controls: (id: string) => ({ "aria-controls": id }),
    current: (
      current: boolean | "page" | "step" | "location" | "date" | "time",
    ) => ({
      "aria-current": current,
    }),
    live: (live: "off" | "polite" | "assertive") => ({ "aria-live": live }),
    atomic: (atomic: boolean) => ({ "aria-atomic": atomic }),
    relevant: (relevant: "additions" | "removals" | "text" | "all") => ({
      "aria-relevant": relevant,
    }),
    busy: (busy: boolean) => ({ "aria-busy": busy }),
    disabled: (disabled: boolean) => ({ "aria-disabled": disabled }),
    readonly: (readonly: boolean) => ({ "aria-readonly": readonly }),
    required: (required: boolean) => ({ "aria-required": required }),
    invalid: (invalid: boolean) => ({ "aria-invalid": invalid }),
    errormessage: (id: string) => ({ "aria-errormessage": id }),
    autocomplete: (autocomplete: "none" | "inline" | "list" | "both") => ({
      "aria-autocomplete": autocomplete,
    }),
    haspopup: (
      haspopup: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog",
    ) => ({
      "aria-haspopup": haspopup,
    }),
    level: (level: number) => ({ "aria-level": level }),
    multiline: (multiline: boolean) => ({ "aria-multiline": multiline }),
    multiselectable: (multiselectable: boolean) => ({
      "aria-multiselectable": multiselectable,
    }),
    orientation: (orientation: "horizontal" | "vertical") => ({
      "aria-orientation": orientation,
    }),
    placeholder: (placeholder: string) => ({ "aria-placeholder": placeholder }),
    pressed: (pressed: boolean | "mixed") => ({ "aria-pressed": pressed }),
    selected: (selected: boolean) => ({ "aria-selected": selected }),
    sort: (sort: "ascending" | "descending" | "none" | "other") => ({
      "aria-sort": sort,
    }),
    valuemin: (min: number) => ({ "aria-valuemin": min }),
    valuemax: (max: number) => ({ "aria-valuemax": max }),
    valuenow: (now: number) => ({ "aria-valuenow": now }),
    valuetext: (text: string) => ({ "aria-valuetext": text }),
  };
}

export const ariaHelpers = new AriaHelpers();
