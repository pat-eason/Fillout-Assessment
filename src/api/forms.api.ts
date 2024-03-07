import axios from "axios";

import { getApiConstants } from "../constants/api.constants";

export enum FormStatus {
  InProgress = "in_progress",
  Finished = "finished",
}

export enum FormSort {
  ASC = "asc",
  DESC = "desc",
}

type FormStatusType = FormStatus.Finished | FormStatus.InProgress;

type FormSortType = FormSort.ASC | FormSort.DESC;

export interface RetrieveFormsSubmissionsRequestType {
  /**
   * (optional) - a date string to filter responses submitted after this date
   */
  afterDate?: Date;
  /**
   * (optional) - a date string to filter responses submitted before this date
   */
  beforeDate?: Date;
  /**
   * (optional) - pass true to include a link to edit the submission as editLink
   */
  includeEditLink?: boolean;
  /**
   * (optional) - the maximum number of responses to retrieve per request. Must be a number between 1 and 150. Default is 150.
   */
  limit?: number;
  /**
   * (optional) - the starting position from which to fetch the responses. Default is 0.
   */
  offset?: number;
  /**
   * (optional) - can be asc or desc, defaults to asc
   */
  sort?: FormSortType;
  /**
   * (optional) - pass in_progress to get a list of in-progress (unfinished) submissions. By default, only finished submissions are returned.
   */
  status?: FormStatusType;
}

type FormQuestionType = {
  id: string;
  name: string;
  type: string;
  value: string | number | null;
};

export type FormSubmissionType = {
  submissionId: string;
  submissionTime: string;
  lastUpdatedAt: string;
  questions: FormQuestionType[];
  calculations: any[];
  urlParameters: any[];
  quiz: Record<string, any>;
  documents: any[];
};

export type RetrieveFormSubmissionsResponseType = {
  responses: FormSubmissionType[];
  totalResponses: number;
  pageCount: number;
};

export const retrieveFormSubmissions = async (
  formId: string,
  request: RetrieveFormsSubmissionsRequestType
): Promise<RetrieveFormSubmissionsResponseType> => {
  const { apiKey, baseUrl } = getApiConstants();

  const requestUrl = `${baseUrl}/v1/api/forms/${formId}/submissions`;
  const response = await axios.get<RetrieveFormSubmissionsResponseType>(
    requestUrl,
    {
      params: request,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  return response.data;
};
