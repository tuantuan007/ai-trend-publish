
import { z } from "zod";
import FirecrawlApp from "firecrawl";
import { ContentScraper, ScrapedContent, ScraperOptions } from "../interfaces/scraper.interface";
import { ConfigManager } from "@src/utils/config/config-manager";
import { formatDate } from "@src/utils/common";


// 使用 zod 定义数据结构
const StorySchema = z.object({
  headline: z.string(),
  content: z.string(),
  link: z.string(),
  date_posted: z.string(),
});

const StoriesSchema = z.object({
  stories: z.array(StorySchema),
});


export class FireCrawlScraper implements ContentScraper {
  private app!: FirecrawlApp;

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.validateConfig();
    this.app = new FirecrawlApp({
      apiKey: await ConfigManager.getInstance().get("FIRE_CRAWL_API_KEY"),
    });
  }

  async validateConfig(): Promise<void> {
    if (!(await ConfigManager.getInstance().get("FIRE_CRAWL_API_KEY"))) {
      throw new Error("FIRE_CRAWL_API_KEY 环境变量未设置");
    }
  }

  private generateId(url: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const urlHash = url.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return `fc_${timestamp}_${random}_${Math.abs(urlHash)}`;
  }

  async scrape(
    sourceId: string,
    options?: ScraperOptions
  ): Promise<ScrapedContent[]> {
    try {
      const currentDate = new Date().toLocaleDateString();

      // 构建提取提示词
      const promptForFirecrawl = `
      Return only today's AI or LLM related story or post headlines and links in JSON format from the page content. 
      They must be posted today, ${currentDate}. The format should be:
        {
          "stories": [
            {
              "headline": "headline1",
              "content":"content1"
              "link": "link1",
              "date_posted": "YYYY-MM-DD HH:mm:ss",
            },
            ...
          ]
        }
      If there are no AI or LLM stories from today, return {"stories": []}.
      
      The source link is ${sourceId}. 
      If a story link is not absolute, prepend ${sourceId} to make it absolute. 
      Return only pure JSON in the specified format (no extra text, no markdown, no \\\\).  
      The content should be about 500 words, which can summarize the full text and the main point.
      Translate all into Chinese.
      !!
      `;

      // 使用 FirecrawlApp 进行抓取
      const scrapeResult = await this.app.scrapeUrl(sourceId, {
        formats: ["extract"],
        extract: {
          prompt: promptForFirecrawl,
          schema: StoriesSchema,
        },
      });

      if (!scrapeResult.success || !scrapeResult.extract?.stories) {
        throw new Error(scrapeResult.error || "未获取到有效内容");
      }

      // 使用 zod 验证返回数据
      const validatedData = StoriesSchema.parse(scrapeResult.extract);

      // 转换为 ScrapedContent 格式
      console.log(
        `[FireCrawl] 从 ${sourceId} 获取到 ${validatedData.stories.length} 条内容`
      );
      return validatedData.stories.map((story) => ({
        id: this.generateId(story.link),
        title: story.headline,
        content: story.content,
        url: story.link,
        publishDate: formatDate(story.date_posted),
        score: 0,
        metadata: {
          source: "fireCrawl",
          originalUrl: story.link,
          datePosted: story.date_posted,
        },
      }));
    } catch (error) {
      console.error("FireCrawl抓取失败:", error);
      throw error;
    }
  }
}
