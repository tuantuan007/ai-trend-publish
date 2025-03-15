import { startCronJobs } from "./controllers/cron.ts";
import { ConfigManager } from "./utils/config/config-manager.ts";

async function bootstrap() {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();

  startCronJobs();
}

bootstrap().catch(console.error);
