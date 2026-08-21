import app from "./app.ts";
import { envVariables } from "./config/env.ts";
import { testConnection } from "./config/database.ts";

await testConnection();

app.listen(envVariables.PORT, () => {
  console.log("server started at port", envVariables.PORT);
});
