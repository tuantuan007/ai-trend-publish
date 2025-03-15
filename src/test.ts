// deno-lint-ignore-file no-unused-vars
import { WeixinArticleWorkflow } from "@src/services/weixin-article.workflow.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { EnvConfigSource } from "@src/utils/config/sources/env-config.source.ts";
import { DbConfigSource } from "@src/utils/config/sources/db-config.source.ts";
import { MySQLDB } from "@src/utils/db/mysql.db.ts";
import { WeixinAIBenchWorkflow } from "@src/services/weixin-aibench.workflow.ts";
import { WeixinHelloGithubWorkflow } from "@src/services/weixin-hellogithub.workflow.ts";
import { Logger, LogLevel } from "@zilla/logger";

Logger.level = LogLevel.DEBUG;

async function bootstrap() {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();

  const weixinWorkflow = new WeixinArticleWorkflow({
    id: "123",
  });

  await weixinWorkflow.execute({
    payload: {
      sourceType: "all",
      maxArticles: 10,
      forcePublish: true,
    },
    id: "123",
    timestamp: Date.now(),
  });

  // const weixinAIBenchWorkflow = new WeixinAIBenchWorkflow();
  // await weixinAIBenchWorkflow.process();

  // const weixinHelloGithubWorkflow = new WeixinHelloGithubWorkflow();
  // await weixinHelloGithubWorkflow.process();
}

bootstrap().catch(console.error);
