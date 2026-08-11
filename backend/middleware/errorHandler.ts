import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string | number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[GLOBAL ERROR HANDLER]:", {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.status || err.statusCode,
  });

  const statusCode = err.status || err.statusCode || 500;
  let errorMessage = err.message || "An unexpected system error occurred.";

  // Standardize Supabase/PostgreSQL constraint codes (e.g. 23505 - Unique Violation)
  const errCodeStr = String(err.code || "");
  if (errCodeStr.startsWith("23")) {
    if (errCodeStr === "23505") {
      errorMessage = "A record with this unique identifier or key already exists.";
    } else if (errCodeStr === "23503") {
      errorMessage = "Referenced foreign entity mapping could not be validated.";
    } else {
      errorMessage = "Database constraint violation occurred.";
    }
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: err.code || "INTERNAL_SERVER_ERROR",
  });
};
