import express from "express";
import { healthHandler } from "./routes/health.js";
import { ingestHandler } from "./routes/ingest.js";
import { scoreHandler } from "./routes/score.js";
import { embedHandler } from "./routes/embed.js";
import { webhookHandler } from "./routes/webhook.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get("/health", healthHandler);
app.post("/ingest", ingestHandler);
app.post("/score", scoreHandler);
app.post("/embed", embedHandler);
app.post("/webhook", webhookHandler);

app.listen(PORT, () => {
  console.log(`[pipeline] running on port ${PORT}`);
});
