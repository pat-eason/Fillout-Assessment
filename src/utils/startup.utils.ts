import dotenv, { DotenvConfigOutput } from "dotenv";
import express from "express";

import { loadFormRoutes } from "../routes/form.routes";

export const initEnv = (): DotenvConfigOutput => dotenv.config();

/**
 * @description 1) sets the value of `PORT` to either the environment variable
 * `process.env.PORT` or the default value of 3001, 2) creates an Express app instance,
 * 3) adds JSON support using `express.json()`, and 4) defines a route for the loadForm
 * endpoint using `loadFormRoutes`. Finally, it listens on the port specified in the
 * `PORT` variable.
 */
export const initRouter = () => {
  const port = process.env.PORT || 3001;
  const app = express();

  app.use(express.json());
  loadFormRoutes(app);
  app.listen(port, () => {
    console.log(`Fillout server is serving at [${port}]`);
  });
};
