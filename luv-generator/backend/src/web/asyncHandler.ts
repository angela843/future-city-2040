import { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void> | void
): RequestHandler {
  return (req, res, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFoundCase(): ApiError {
  return new ApiError(404, "case_not_found", "Fall wurde nicht gefunden (Session evtl. abgelaufen).");
}
