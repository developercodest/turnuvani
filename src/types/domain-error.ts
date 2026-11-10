/** Error codes emitted by pure tournament domain operations. */
export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_STATE"
  | "INVALID_RESULT"
  | "INVALID_PARTICIPANT"
  | "TOURNAMENT_NOT_FOUND";

/**
 * Serializable error shape for expected domain failures.
 *
 * This intentionally stays independent from HTTP and UI concerns so it can
 * be returned from server-side application services as well as domain logic.
 */
export interface DomainError {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
