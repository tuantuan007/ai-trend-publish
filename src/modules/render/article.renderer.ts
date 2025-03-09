import path from "path";
import fs from "fs";
import { BaseTemplateRenderer } from "./base.renderer";
import { WeixinTemplate } from "./interfaces/template.type";

/**
 * 文章模板渲染器
 */
export class ArticleTemplateRenderer extends BaseTemplateRenderer<WeixinTemplate[]> {
    constructor() {
        super('article');
        this.availableTemplates = ['default', 'modern', 'tech', 'mianpro'];
    }

    /**
     * 加载文章模板文件
     */
    protected loadTemplates(): void {
        this.templates = {
            default: fs.readFileSync(path.join(__dirname, "../../templates/article/article.ejs"), "utf-8"),
            modern: fs.readFileSync(path.join(__dirname, "../../templates/article/article.modern.ejs"), "utf-8"),
            tech: fs.readFileSync(path.join(__dirname, "../../templates/article/article.tech.ejs"), "utf-8"),
            mianpro: fs.readFileSync(path.join(__dirname, "../../templates/article/article.mianpro.ejs"), "utf-8"),
        };
    }
}