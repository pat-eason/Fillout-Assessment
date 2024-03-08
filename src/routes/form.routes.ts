import { Express, Request, Response } from "express";
import { param, query, ValidationChain } from "express-validator";
import { StatusCodes } from "http-status-codes";

import {
  FormSort,
  FormStatus,
  RetrieveFormsSubmissionsRequestType,
  retrieveFormSubmissions,
} from "../api/forms.api";
import { validateRequest } from "../utils/validation.utils";
import {
  filterFormSubmissions,
  validateFilters,
} from "../utils/form-submission.utils";

const formStatusValues = [FormStatus.Finished, FormStatus.InProgress];
const sortValues = [FormSort.ASC, FormSort.DESC];

const retrieveFormResponsesValidations: ValidationChain[] = [
  param("formId", "A Form ID is required").isString(),
  query("limit", "limit must be an integer")
    .isInt()
    .toInt()
    .optional()
    .default(150),
  query("afterDate", "afterDate must be a valid ISO date string")
    .isDate()
    .toDate()
    .optional(),
  query("beforeDate", "beforeDate must be a valid ISO date string")
    .isDate()
    .toDate()
    .optional(),
  query("offset", "offset must an integer")
    .isInt()
    .toInt()
    .optional()
    .default(0),
  query("status", `status must be one of: ${formStatusValues.join(", ")}`)
    .isIn(formStatusValues)
    .optional(),
  query("includeEditLink", "includeEditLink must be a boolean")
    .isBoolean()
    .optional(),
  query("sort", `Sort must be one of: ${sortValues.join(", ")}`)
    .isIn(sortValues)
    .optional(),
  /**
   * @note while the ask was for url encoded JSON in the GET param that could
   * quickly hit the threshold for url lengths
   */
  query("filters").isString().optional(),
];

const retrieveFormResponsesRoute = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      formId,
      limit,
      afterDate,
      beforeDate,
      offset,
      status,
      includeEditLink,
      sort,
      filters,
    } = validateRequest(req, res);

    const requestPayload: RetrieveFormsSubmissionsRequestType = {
      limit,
      afterDate,
      beforeDate,
      offset,
      status,
      includeEditLink,
      sort,
    };
    const formSubmissions = await retrieveFormSubmissions(
      formId,
      requestPayload
    );
    const filteredFormSubmissions = filterFormSubmissions(
      formSubmissions,
      validateFilters(filters)
    );

    return res.status(StatusCodes.OK).send(filteredFormSubmissions);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: (err as Error).message,
    });
  }
};

export const loadFormRoutes = (app: Express) => {
  app.get(
    "/:formId/filteredResponses",
    retrieveFormResponsesValidations,
    retrieveFormResponsesRoute
  );
};
