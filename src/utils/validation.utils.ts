import { Request, Response } from "express";
import {
  validationResult,
  ValidationError,
  matchedData,
} from "express-validator";
import { StatusCodes } from "http-status-codes";

const formatErrorResponse = (errors: ValidationError[]) => ({
  validationErrors: errors.map((x) => x.msg),
});

export const validateRequest = (req: Request, res: Response) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    res
      .status(StatusCodes.UNPROCESSABLE_ENTITY)
      .json(formatErrorResponse(result.array()));
    throw new Error("Request failed validation");
  }

  return matchedData(req);
};
