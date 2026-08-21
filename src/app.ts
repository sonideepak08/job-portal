import express from "express";
import authRouter from "./routes/auth.routes.ts";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("server is up");
});

app.use("/auth", authRouter);

export default app;
