import path from "path";
import ejs from "ejs";
import { ConfigManager } from "../../utils/config/config-manager";
import fs from "fs";

/**
 * 基础模板渲染器类
 */
export abstract class BaseTemplateRenderer<T> {
    protected templates: { [key: string]: string } = {};
    protected configManager: ConfigManager;
    protected availableTemplates: string[] = [];
    protected templatePrefix: string;

    constructor(templatePrefix: string) {
        this.templatePrefix = templatePrefix;
        this.loadTemplates();
        this.configManager = ConfigManager.getInstance();
    }

    /**
     * 加载模板文件
     */
    protected abstract loadTemplates(): void;

    /**
     * 从配置中获取模板类型
     * @returns 配置的模板类型或默认值
     */
    protected async getTemplateTypeFromConfig(): Promise<string> {
        try {
            const configKey = `${this.templatePrefix.toUpperCase()}_TEMPLATE_TYPE`;
            const configValue = await this.configManager.get<string>(configKey);

            if (configValue === 'random') {
                return this.getRandomTemplateType();
            }
            return configValue;
        } catch (error) {
            console.log(`未找到${this.templatePrefix}模板配置，使用默认模板`);
            return this.availableTemplates[0];
        }
    }

    /**
     * 随机选择一个模板类型
     * @returns 随机选择的模板类型
     */
    protected getRandomTemplateType(): string {
        const randomIndex = Math.floor(Math.random() * this.availableTemplates.length);
        return this.availableTemplates[randomIndex];
    }

    /**
     * 渲染模板
     * @param data 渲染数据
     * @param templateType 模板类型，或者 'config'（从配置获取）或 'random'（随机选择）
     * @returns 渲染后的 HTML
     */
    public async render(
        data: T extends ejs.Data ? T : ejs.Data,
        templateType?: string
    ): Promise<string> {
        try {
            let finalTemplateType: string;

            // 如果没有传templateType，从配置获取
            if (!templateType) {
                finalTemplateType = await this.getTemplateTypeFromConfig();
            } else if (templateType === 'random') {
                // 如果指定random，随机选择模板
                finalTemplateType = this.getRandomTemplateType();
            } else {
                // 检查指定的模板是否存在
                if (!this.availableTemplates.includes(templateType)) {
                    throw new Error(`Template type '${templateType}' not found for ${this.templatePrefix}`);
                }
                finalTemplateType = templateType;
            }

            console.log(`使用${this.templatePrefix}模板: ${finalTemplateType}`);

            const template = this.templates[finalTemplateType];
            if (!template) {
                throw new Error(`Template '${finalTemplateType}' not found for ${this.templatePrefix}`);
            }

            // 使用 EJS 渲染模板
            return ejs.render(
                template,
                {
                    articles: data,
                },
                {
                    rmWhitespace: true,
                }
            );
        } catch (error) {
            console.error("模板渲染失败:", error);
            throw error;
        }
    }
}