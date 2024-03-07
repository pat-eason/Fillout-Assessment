import dotenv, { DotenvConfigOutput } from "dotenv";
import express from "express";

import { loadFormRoutes } from "../routes/form.routes";

export const initEnv = (): DotenvConfigOutput => dotenv.config();

export const initRouter = () => {
  const port = 3000;
  const app = express();

  app.use(express.json());
  loadFormRoutes(app);
  app.listen(port, () => {
    console.log(`Fillout server is serving at [${port}]`);
  });
};
