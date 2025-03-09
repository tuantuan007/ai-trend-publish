import path from "path";
import fs from "fs";
import { BaseTemplateRenderer } from "./base.renderer";
import { AIGithubItemDetail } from "./interfaces/aigithub.type";

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
}