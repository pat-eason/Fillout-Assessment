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

/**
 * @description takes a `Request` and `Response` objects as input, and retrieves form
 * submissions from the database based on user input parameters such as form ID,
 * limit, after date, before date, offset, status, include edit link, and sort. It
 * then filters the submissions based on specified filters and returns them to the
 * user in a JSON format.
 * 
 * @param { Request } req - request object containing the parameters for retrieving
 * form submissions.
 * 
 * @param { Response } res - HTTP response object that will be used to send the
 * retrieved form submissions back to the client.
 * 
 * @returns { Promise<Response | void> } a list of filtered form submissions sent to
 * the client in JSON format.
 */
const retrieveFormResponsesRoute = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const requestParams = validateRequest(req, res);
    if (!requestParams) {
      return;
    }
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
    } = requestParams;

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
    console.log("err", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: (err as Error).message,
    });
  }
};

/**
 * @description loads routes for form responses by calling three internal functions:
 * `retrieveFormResponsesValidations`, `retrieveFormResponsesRoute`. These functions
 * retrieve form responses data and validate it.
 * 
 * @param { Express } app - Express application instance that the function operates
 * on, providing a route for handling GET requests to `/:formId/filteredResponses`.
 */
export const loadFormRoutes = (app: Express) => {
  app.get(
    "/:formId/filteredResponses",
    retrieveFormResponsesValidations,
    retrieveFormResponsesRoute
  );
};
