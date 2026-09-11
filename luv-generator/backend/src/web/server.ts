import { createApp } from "./app.js";
import { logEvent } from "./logger.js";

const app = createApp();
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  logEvent("server_started", { port });
  // eslint-disable-next-line no-console
  console.log(`LUV-Generator Backend (TESTSYSTEM) läuft auf http://localhost:${port}`);
});

export { app };
