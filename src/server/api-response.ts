export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "REVISION_CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  init: ResponseInit & { details?: unknown } = {}
) {
  const { details, ...responseInit } = init;
  const status = responseInit.status ?? statusForErrorCode(code);

  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    } satisfies ApiErrorBody,
    { ...responseInit, status }
  );
}

export function successResponse<T>(
  data: T,
  init: ResponseInit = {}
): Response {
  return Response.json(
    {
      ok: true,
      data,
    } satisfies ApiSuccessBody<T>,
    init
  );
}

function statusForErrorCode(code: ApiErrorCode): number {
  switch (code) {
    case "BAD_REQUEST":
    case "VALIDATION_ERROR":
    case "REVISION_CONFLICT":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL_ERROR":
      return 500;
  }
}
