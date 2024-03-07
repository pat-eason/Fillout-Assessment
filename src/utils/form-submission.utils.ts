import { isDate, isValid, parse } from "date-fns";

import { RetrieveFormSubmissionsResponseType } from "../api/forms.api";

export enum FilterConditions {
  Equals = "equals",
  DoesNotEqual = "does_not_equal",
  GreaterThan = "greater_than",
  LessThan = "less_than",
}

type SubmissionFilterConditionType =
  | FilterConditions.Equals
  | FilterConditions.DoesNotEqual
  | FilterConditions.GreaterThan
  | FilterConditions.LessThan;

type RequestFilterClauseType = {
  id: string;
  condition: SubmissionFilterConditionType;
  value: number | string;
};

type SubmissionFiltersType = RequestFilterClauseType;

export const validateFilters = (filters: string): SubmissionFiltersType[] => {
  try {
    const parsedFilters = JSON.parse(filters);
    return parsedFilters.filter(
      (x: any) =>
        !!x.condition &&
        Object.values(FilterConditions).includes(x.condition) &&
        !!x.id &&
        !!x.value
    );
  } catch (err) {
    return [];
  }
};

type NormalizedValue = string | number | Date;

const normalizeValue = (value: any): NormalizedValue => {
  if (!value || typeof value === "number") {
    return value;
  }
  /**
   * @note this is incredibly optimistic and only based on the seen date format
   */
  const parsedDate = parse(value, "yyyy-MM-dd", new Date());
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  return value;
};

const evaluateFilter = (
  questionValue: string | number | null,
  filter: SubmissionFiltersType
): boolean => {
  let normalizedQuestionValue = normalizeValue(questionValue);
  if (isDate(normalizedQuestionValue)) {
    normalizedQuestionValue = normalizedQuestionValue.getTime();
  }
  let normalizedFilterValue = normalizeValue(filter.value);
  if (isDate(normalizedFilterValue)) {
    normalizedFilterValue = normalizedFilterValue.getTime();
  }

  switch (filter.condition) {
    case FilterConditions.Equals:
      return normalizedQuestionValue === normalizedFilterValue;
    case FilterConditions.DoesNotEqual:
      return normalizedQuestionValue !== normalizedFilterValue;
    case FilterConditions.GreaterThan:
      return normalizedQuestionValue > normalizedFilterValue;
    case FilterConditions.LessThan:
      return normalizedQuestionValue < normalizedFilterValue;
    default:
      return false;
  }
};

export const filterFormSubmissions = (
  submissionResponse: RetrieveFormSubmissionsResponseType,
  filters: SubmissionFiltersType[]
): RetrieveFormSubmissionsResponseType => {
  let validResponses = [...submissionResponse.responses];

  for (let i = 0; i < filters.length; i++) {
    if (!validResponses.length) {
      break;
    }
    const currentFilter = filters[i];

    validResponses = validResponses.filter((x) => {
      const filterQuestionIndex = x.questions.findIndex(
        (y) => y.id === currentFilter.id
      );
      // cannot find matching question, eject
      if (filterQuestionIndex < 0) {
        return false;
      }

      const filterQuestion = x.questions[filterQuestionIndex];
      return evaluateFilter(filterQuestion.value, currentFilter);
    });
  }

  return {
    ...submissionResponse,
    /**
     * @note since the server is not evaluating filters the total count is optimistic
     * to the slice that the client is aware of
     */
    totalResponses:
      submissionResponse.totalResponses -
      (submissionResponse.responses.length - validResponses.length),
    responses: validResponses,
  };
};
