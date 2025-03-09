import axios from "axios";
import { AliTaskResponse, BaseAliyunImageGenerator } from "./base.aliyun.image-generator";

export interface AliWanX21Options {
  prompt: string;
  size?: string;
}

export class AliWanX21ImageGenerator extends BaseAliyunImageGenerator {
  constructor() {
    super();
    this.baseUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    this.model = "wanx2.1-t2i-turbo";
  }

  /**
   * 生成图片
   * @param options 生成选项
   * @returns 图片URL数组
   */
  async generate(options: AliWanX21Options): Promise<string> {
    const { prompt, size = "1024*1024" } = options;
    try {
      const response = await this.submitTask<AliTaskResponse>({
        input: {
          prompt,
          size,
        },
      });

      const taskId = response.output.task_id;
      return this.waitForCompletion(taskId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `图片生成失败: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}
