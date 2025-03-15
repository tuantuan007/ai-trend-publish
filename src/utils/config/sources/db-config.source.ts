import { MySQLDB } from "../../db/mysql.db.ts";
import { IConfigSource } from "../interfaces/config-source.interface.ts";

export class DbConfigSource implements IConfigSource {
  constructor(
    private db: MySQLDB, // 这里应该替换为你的实际数据库连接类型
    public priority: number = 10,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.db.queryOne(
        "SELECT `value` FROM `config` WHERE `key` = ?",
        [key],
      );

      if (!result || result.length === 0) {
        return null;
      }

      const value = result.value;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Error fetching config from database: ${error}`);
      return null;
    }
  }
}
