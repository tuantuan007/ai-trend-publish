import { BaseTemplateRenderer } from "@src/modules/render/base.renderer.ts";
import { WeixinTemplate } from "@src/modules/render/interfaces/article.type.ts";
import ejs from "npm:ejs";
import { WeixinImageProcessor } from "@src/utils/image/image-processor.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";

/**
 * 文章模板渲染器
 */
export class WeixinArticleTemplateRenderer
  extends BaseTemplateRenderer<WeixinTemplate[]> {
  constructor() {
    super("article");
    this.availableTemplates = ["default", "modern", "tech", "mianpro"];
  }

  /**
   * 预处理文章内容，将图片插入到段落之间
   * @param article 文章数据
   * @returns 处理后的文章数据
   */
  private processArticleContent(article: WeixinTemplate): WeixinTemplate {
    if (!article.media || article.media.length === 0) {
      return article;
    }

    // 分割段落
    const paragraphs = article.content.split("<next_paragraph />");
    const mediaUrls = article.media.map((m) => m.url);
    let mediaIndex = 0;

    // 在段落之间插入图片
    let processedContent = "";

    // 第一张图片放在文章开头
    if (mediaUrls.length > 0) {
      processedContent += `<img src="${
        mediaUrls[0]
      }" alt="文章配图" /><next_paragraph />`;
      mediaIndex++;
    }

    // 遍历段落，在段落之间插入图片
    paragraphs.forEach((paragraph, index) => {
      processedContent += paragraph;

      // 如果还有图片，且不是最后一个段落，在段落后插入图片
      if (mediaIndex < mediaUrls.length && index < paragraphs.length - 1) {
        processedContent += `<next_paragraph /><img src="${
          mediaUrls[mediaIndex]
        }" alt="文章配图" />`;
        mediaIndex++;
      }

      // 如果不是最后一个段落，添加段落分隔符
      if (index < paragraphs.length - 1) {
        processedContent += "<next_paragraph />";
      }
    });

    return {
      ...article,
      content: processedContent,
    };
  }

  /**
   * 加载文章模板文件
   */
  protected async loadTemplates(): Promise<void> {
    this.templates = {
      default: await this.getTemplateContent("/templates/article/article.ejs"),
      modern: await this.getTemplateContent(
        "/templates/article/article.modern.ejs",
      ),
      tech: await this.getTemplateContent(
        "/templates/article/article.tech.ejs",
      ),
      mianpro: await this.getTemplateContent(
        "/templates/article/article.mianpro.ejs",
      ),
    };
  }

  /**
   * 实现doRender方法，添加预处理步骤
   */
  public async doRender(
    data: WeixinTemplate[],
    template: string,
  ): Promise<string> {
    const imageProcessor = new WeixinImageProcessor(new WeixinPublisher());
    // 预处理每篇文章 插入图片到段落之间
    console.log(
      `WeixinArticleTemplateRenderer doRender: ${data.length} articles`,
    );
    const processedData = data.map((article) =>
      this.processArticleContent(article)
    );

    // 将图片上传到微信 并替换图片url
    for (const article of processedData) {
      const { content, results } = await imageProcessor.processContent(
        article.content,
      );
      article.content = content;
      console.log(results);
    }

    return ejs.render(
      template,
      {
        articles: processedData,
      },
      { rmWhitespace: true },
    );
  }
}
