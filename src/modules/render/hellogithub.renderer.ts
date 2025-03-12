import path from "path";
import fs from "fs";
import { BaseTemplateRenderer } from "./base.renderer";
import { AIGithubItemDetail } from "./interfaces/aigithub.type";
import ejs from "ejs";

/**
 * HelloGithub模板渲染器
 */
export class HelloGithubTemplateRenderer extends BaseTemplateRenderer<AIGithubItemDetail[]> {
  constructor() {
    super('hellogithub');
    this.availableTemplates = ['default'];
  }

  /**
   * 加载HelloGithub模板文件
   */
  protected loadTemplates(): void {
    this.templates = {
      default: fs.readFileSync(path.join(__dirname, "../../templates/hellogithub.ejs"), "utf-8"),
    };
  }

  /**
   * 渲染HelloGithub模板
   * @param data 渲染数据
   * @param template 模板
   * @returns 渲染后的HTML
   */
  protected async doRender(data: AIGithubItemDetail[], template: string): Promise<string> {
    return ejs.render(
      template,
      {
        renderDate: new Date().toLocaleDateString(),
        items: data,
      },
      { rmWhitespace: true }
    );
  }

}