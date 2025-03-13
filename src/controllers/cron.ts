import cron from "npm:node-cron";
import { WeixinWorkflow } from "@src/services/weixin-article.workflow.ts";
import { Workflow } from "@src/services/interfaces/workflow.interface.ts";
import { WeixinAIBenchWorkflow } from "@src/services/weixin-aibench.workflow.ts";
import { WeixinHelloGithubWorkflow } from "@src/services/weixin-hellogithub.workflow.ts";
import { BarkNotifier } from "@src/modules/notify/bark.notify.ts";

// 工作流映射表，用于存储不同日期对应的工作流
const workflowMap = new Map<number, Workflow>();

// 初始化工作流映射
const initializeWorkflows = () => {
  // 周一的工作流 (1)
  workflowMap.set(1, new WeixinWorkflow());
  // 其他日期的工作流可以在这里添加
  workflowMap.set(2, new WeixinAIBenchWorkflow()); // 周二
  // workflowMap.set(3, new AnotherWorkflow()); // 周三
  workflowMap.set(3, new WeixinHelloGithubWorkflow()); // 周三

  workflowMap.set(4, new WeixinWorkflow());

  workflowMap.set(5, new WeixinWorkflow());

  workflowMap.set(6, new WeixinWorkflow());

  workflowMap.set(7, new WeixinWorkflow());
};

export const startCronJobs = () => {
  const barkNotifier = new BarkNotifier();
  barkNotifier.notify("定时任务启动", "定时任务启动");
  console.log("初始化定时任务...");
  initializeWorkflows();

  // 每天凌晨3点执行
  cron.schedule(
    "0 3 * * *",
    async () => {
      const dayOfWeek = new Date().getDay(); // 0是周日，1-6是周一到周六
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 将周日的0转换为7

      const workflow = workflowMap.get(adjustedDay);
      if (workflow) {
        console.log(`开始执行周${adjustedDay}的工作流...`);
        try {
          await workflow.process();
        } catch (error) {
          console.error(`工作流执行失败:`, error);
        }
      } else {
        console.log(`周${adjustedDay}没有配置对应的工作流`);
      }
    },
    {
      timezone: "Asia/Shanghai",
    },
  );
};
