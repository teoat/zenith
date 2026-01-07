export class ApiError extends Error {
  statusCode: number;
  originalMessage?: string;

  constructor(message: string, statusCode: number, originalMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.originalMessage = originalMessage;
  }
}
