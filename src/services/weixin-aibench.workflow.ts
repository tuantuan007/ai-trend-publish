import { Workflow } from "./interfaces/workflow.interface";
import { LiveBenchAPI } from "../api/livebench.api";
import { AIBenchTemplateRenderer } from "@src/modules/render";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher";
import { CategoryData, ModelScore } from "@src/modules/render/interfaces/aibench.type";
import { PDD920LogoGenerator } from "@src/providers/image-gen/pdd920-logo";
import { BarkNotifier } from "@src/modules/notify/bark.notify";
import { ImageGeneratorFactory } from "@src/providers/image-gen/image-generator-factory";

export class WeixinAIBenchWorkflow implements Workflow {
  private liveBenchAPI: LiveBenchAPI;
  private renderer: AIBenchTemplateRenderer;
  private notify: BarkNotifier;
  private publisher: WeixinPublisher;

  constructor() {
    this.liveBenchAPI = new LiveBenchAPI();
    this.renderer = new AIBenchTemplateRenderer();
    this.notify = new BarkNotifier();
    this.publisher = new WeixinPublisher();
  }

  async generateCoverImage(title: string): Promise<string> {
    // 生成封面图并获取URL
    const imageGenerator = await ImageGeneratorFactory.getInstance().getGenerator("PDD920_LOGO");
    const imageResult = await imageGenerator.generate({
      t: "@AISPACE科技空间",
      text: title,
      type: "json"
    });

    // 由于type为json，imageResult一定是包含url的对象
    return imageResult as string;
  }

  async process(): Promise<void> {
    try {
      // 获取所有模型的性能数据
      const modelData = await this.liveBenchAPI.getModelPerformance();

      console.log('modelData:', modelData);

      // 找出性能最好的模型
      const topModel = Object.entries(modelData)
        .sort((a, b) => b[1].metrics["Global Average"] - a[1].metrics["Global Average"])[0];
      const topModelName = topModel[0];
      const topModelOrg = topModel[1].organization || '未知机构';

      // 准备模板数据
      const templateData = {
        title: `${topModelName}领跑！AI模型性能榜单 - ${new Date().toLocaleDateString()}`,
        updateTime: new Date().toISOString(),
        categories: [] as CategoryData[],
        globalTop10: [] as ModelScore[],
      };
      // 将modelData转换为AIBenchTemplate格式
      const formattedData = this.renderer.transformData(modelData);

      // 准备分类数据
      templateData.categories = formattedData.categories;

      // 准备全局排名前10的数据
      templateData.globalTop10 = formattedData.globalTop10.slice(0, 10);

      // 渲染内容
      const htmlContent = await this.renderer.render(templateData);

      // 发布到微信公众号
      const title = `${topModelName}领跑！${new Date().toLocaleDateString()} AI模型性能榜单`;
      const imageTitle = `本周大模型排行 ${topModelOrg}旗下大模型登顶`;
      const imageUrl = await this.generateCoverImage(imageTitle);
      const mediaId = await this.publisher.uploadImage(imageUrl);

      const publishResult = await this.publisher.publish(
        htmlContent,
        title,
        title,
        mediaId
      );

      // 发送通知
      console.log("publishResult:", publishResult);
      await this.notify.info(
        "AI Benchmark更新",
        `已生成并发布最新的AI模型性能榜单\n发布状态: ${publishResult.status}`
      );
    } catch (error) {
      console.error("Error processing WeixinAIBenchWorkflow:", error);
      await this.notify.error(
        "AI Benchmark更新失败",
        `错误: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
