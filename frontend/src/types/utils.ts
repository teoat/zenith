export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type ValueOf<T> = T[keyof T];

export type RequestStatus = "idle" | "loading" | "success" | "error";
