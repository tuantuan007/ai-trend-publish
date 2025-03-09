/**
 * 重试操作的配置选项
 */
export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 基础延迟时间（毫秒） */
  baseDelay?: number;
  /** 是否使用指数退避策略 */
  useExponentialBackoff?: boolean;
}

/**
 * 重试操作工具类
 */
export class RetryUtil {
  /**
   * 执行可重试的异步操作
   * @param operation 需要重试的异步操作
   * @param options 重试配置选项
   * @returns 操作结果的Promise
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.baseDelay ?? 1000;
    const useExponentialBackoff = options.useExponentialBackoff ?? true;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = useExponentialBackoff
          ? baseDelay * Math.pow(2, attempt - 1)
          : baseDelay * attempt;

        await new Promise((resolve) => setTimeout(resolve, delay));
        console.error(
          `重试操作失败 (${attempt}/${maxRetries}): ${error instanceof Error ? error.message : "未知错误"}`
        );
      }
    }
    throw new Error("操作在达到最大重试次数后仍然失败");
  }
}