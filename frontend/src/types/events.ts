// Event Handler Type System - Eliminates 'any' from event handling

import React from "react";

// Base event handler types
export type EventHandler<TEvent = Event> = (event: TEvent) => void;
export type ChangeEventHandler<TElement = HTMLElement> = (
  event: React.ChangeEvent<TElement>,
) => void;
export type FormEventHandler<TElement = HTMLFormElement> = (
  event: React.FormEvent<TElement>,
) => void;
export type FocusEventHandler<TElement = HTMLElement> = (
  event: React.FocusEvent<TElement>,
) => void;
export type KeyboardEventHandler<TElement = HTMLElement> = (
  event: React.KeyboardEvent<TElement>,
) => void;
export type MouseEventHandler<TElement = HTMLElement> = (
  event: React.MouseEvent<TElement>,
) => void;
export type TouchEventHandler<TElement = HTMLElement> = (
  event: React.TouchEvent<TElement>,
) => void;

// Specific input event handlers
export type InputChangeHandler = ChangeEventHandler<HTMLInputElement>;
export type TextareaChangeHandler = ChangeEventHandler<HTMLTextAreaElement>;
export type SelectChangeHandler = ChangeEventHandler<HTMLSelectElement>;

// Form event handlers
export type FormSubmitHandler = FormEventHandler<HTMLFormElement>;
export type FormResetHandler = FormEventHandler<HTMLFormElement>;

// Button and interaction handlers
export type ButtonClickHandler = MouseEventHandler<HTMLButtonElement>;
export type LinkClickHandler = MouseEventHandler<HTMLAnchorElement>;
export type DivClickHandler = MouseEventHandler<HTMLDivElement>;

// Keyboard handlers
export type KeyDownHandler<TElement = HTMLElement> =
  KeyboardEventHandler<TElement>;
export type KeyUpHandler<TElement = HTMLElement> =
  KeyboardEventHandler<TElement>;
export type KeyPressHandler<TElement = HTMLElement> =
  KeyboardEventHandler<TElement>;

// Focus handlers
export type FocusHandler<TElement = HTMLElement> = FocusEventHandler<TElement>;
export type BlurHandler<TElement = HTMLElement> = FocusEventHandler<TElement>;

// Generic component event props
export interface ComponentEventProps {
  onClick?: MouseEventHandler;
  onChange?: ChangeEventHandler;
  onFocus?: FocusHandler;
  onBlur?: BlurHandler;
  onKeyDown?: KeyDownHandler;
  onKeyUp?: KeyUpHandler;
  onSubmit?: FormSubmitHandler;
}

// Form field event props
export interface FormFieldEventProps<TValue = unknown> {
  onChange?: (value: TValue) => void;
  onBlur?: FocusHandler;
  onFocus?: FocusHandler;
}

// Utility types for event data extraction
export type EventValue<TEvent> =
  TEvent extends React.ChangeEvent<infer TElement>
    ? TElement extends
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      ? TElement["value"]
      : unknown
    : unknown;

export type EventTarget<TEvent> = TEvent extends {
  currentTarget: infer TTarget;
}
  ? TTarget
  : unknown;

// Event handler factories
export const createChangeHandler =
  <TValue = unknown>(onChange: (value: TValue) => void) =>
  (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    onChange(event.target.value as TValue);
  };

export const createCheckedHandler =
  (onChange: (checked: boolean) => void) =>
  (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

// Higher-order event handlers
export const withPreventDefault =
  <TEvent extends Event>(handler: EventHandler<TEvent>) =>
  (event: TEvent) => {
    event.preventDefault();
    handler(event);
  };

export const withStopPropagation =
  <TEvent extends Event>(handler: EventHandler<TEvent>) =>
  (event: TEvent) => {
    event.stopPropagation();
    handler(event);
  };
