import path from "node:path";
import { BaseTemplateRenderer } from "@src/modules/render/base.renderer.ts";
import { AIGithubItemDetail } from "@src/modules/render/interfaces/aigithub.type.ts";
import ejs from "npm:ejs";

/**
 * HelloGithub模板渲染器
 */
export class HelloGithubTemplateRenderer
  extends BaseTemplateRenderer<AIGithubItemDetail[]> {
  constructor() {
    super("hellogithub");
    this.availableTemplates = ["default"];
  }

  /**
   * 加载HelloGithub模板文件
   */
  protected async loadTemplates(): Promise<void> {
    this.templates = {
      default: await this.getTemplateContent("/templates/hellogithub.ejs"),
    };
  }

  /**
   * 渲染HelloGithub模板
   * @param data 渲染数据
   * @param template 模板
   * @returns 渲染后的HTML
   */
  protected async doRender(
    data: AIGithubItemDetail[],
    template: string,
  ): Promise<string> {
    return ejs.render(
      template,
      {
        renderDate: new Date().toLocaleDateString(),
        items: data,
      },
      { rmWhitespace: true },
    );
  }
}
