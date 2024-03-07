type Undefinable<T> = T | undefined;

interface ApiConstants {
  apiKey: Undefinable<string>;
  baseUrl: string;
  formId: Undefinable<string>;
}

export const getApiConstants = (): ApiConstants => ({
  apiKey: process.env.API_KEY,
  baseUrl: "https://api.fillout.com",
  formId: process.env.FORM_ID,
});
