/// <reference types="@testing-library/jest-dom" />

// Additional matcher declarations as fallback
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string | RegExp | number): R;
      toHaveClass(...classNames: string[]): R;
      toHaveValue(value?: string | number | string[]): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toBeSelected(): R;
    }
  }
}