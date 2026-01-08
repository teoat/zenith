// Iterator types for custom data structures

export interface IteratorResult<T, TReturn = any> {
  done: boolean;
  value: T | TReturn;
}

export interface IteratorNextStep<T, TReturn = any> {
  done?: boolean;
  value?: T | TReturn;
}
