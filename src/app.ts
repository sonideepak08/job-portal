import express from "express";
import authRouter from "./routes/auth.routes.ts";
import protectedRouter from "./routes/protected.route.ts";
import jobRouter from "./routes/job.route.ts";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("server is up");
});

app.use("/auth", authRouter);
app.use("/api", protectedRouter);
app.use("/jobs", jobRouter);

export default app;
