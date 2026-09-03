import app from "./app.ts";
import { envVariables } from "./config/env.ts";
import { testConnection } from "./config/database.ts";
import { connectRedis } from "./config/redis.ts";

await testConnection();
await connectRedis();

app.listen(envVariables.PORT, () => {
  console.log("server started at port", envVariables.PORT);
});
