import express from "express";
import authRouter from "./routes/auth.routes.ts";
import jobRouter from "./routes/job.routes.ts";
import {
  globalErrorHandler,
  routeErrorHandler,
} from "./middleware/errorHandler.ts";
import applicationRouter from "./routes/application.routes.ts";
import uploadRouter from "./routes/upload.routes.ts";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.ts";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.send("server is up");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);
app.use("/jobs", jobRouter);
app.use("/applications", applicationRouter);
app.use("/uploads", uploadRouter);
app.use(routeErrorHandler);
app.use(globalErrorHandler);

export default app;
