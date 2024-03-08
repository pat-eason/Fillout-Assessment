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
 * @description retrieves form submissions based on a provided query and filters them
 * based on user input. It then sends the filtered responses to the client as JSON.
 * 
 * @param { Request } req - request object sent by the client, containing various
 * parameters for filtering and retrieving form submissions.
 * 
 * @param { Response } res - response object to which the retrieved form submissions
 * will be sent upon successful execution of the function.
 * 
 * @returns { Promise<Response | void> } a list of form submissions filtered by
 * validation filters.
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
 * @description generates high-quality documentation for code given to it and maps
 * GET requests to the `/:formId/filteredResponses` endpoint, where
 * `retrieveFormResponsesValidations` and `retrieveFormResponsesRoute` are used to
 * handle the requests.
 * 
 * @param { Express } app - Express app instance that is being configured to handle
 * requests at the route `/:formId/filteredResponses`.
 */
export const loadFormRoutes = (app: Express) => {
  app.get(
    "/:formId/filteredResponses",
    retrieveFormResponsesValidations,
    retrieveFormResponsesRoute
  );
};
