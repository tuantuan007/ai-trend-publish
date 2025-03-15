import mysql, { Pool, PoolConnection, PoolOptions } from "npm:mysql2/promise";

export class MySQLDB {
  private static instance: MySQLDB;
  private pool: Pool;

  private constructor(config: PoolOptions) {
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  public static async getInstance(config?: PoolOptions): Promise<MySQLDB> {
    if (!MySQLDB.instance && config) {
      MySQLDB.instance = new MySQLDB(config);
      // 测试连接
      try {
        const connection = await MySQLDB.instance.pool.getConnection();
        connection.release();
      } catch (error) {
        throw new Error(`Failed to initialize database connection: ${error}`);
      }
    } else if (!MySQLDB.instance) {
      throw new Error(
        "MySQL configuration is required for first initialization",
      );
    }
    return MySQLDB.instance;
  }

  /**
   * 执行查询并返回结果
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.query(sql, params);

      return rows as T[];
    } catch (error) {
      throw new Error(`Database query error: ${error}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 执行单条查询并返回第一个结果
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 单个查询结果
   */
  public async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 执行插入操作
   * @param table 表名
   * @param data 要插入的数据对象
   * @returns 插入结果
   */
  public async insert(
    table: string,
    data: Record<string, any>,
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${
      keys
        .map(() => "?")
        .join(", ")
    })`;

    let connection: PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.query(sql, values);
      return (result as any).insertId;
    } catch (error) {
      throw new Error(`Database insert error: ${error}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 执行更新操作
   * @param table 表名
   * @param data 要更新的数据对象
   * @param where WHERE条件
   * @returns 受影响的行数
   */
  public async update(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>,
  ): Promise<number> {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];

    let connection: PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.query(sql, params);
      return (result as any).affectedRows;
    } catch (error) {
      throw new Error(`Database update error: ${error}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 执行删除操作
   * @param table 表名
   * @param where WHERE条件
   * @returns 受影响的行数
   */
  public async delete(
    table: string,
    where: Record<string, any>,
  ): Promise<number> {
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const params = Object.values(where);

    let connection: PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.query(sql, params);
      return (result as any).affectedRows;
    } catch (error) {
      throw new Error(`Database delete error: ${error}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 开始事务
   * @returns 事务连接
   */
  public async beginTransaction(): Promise<PoolConnection> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * 在事务中执行查询
   * @param connection 事务连接
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  public async queryWithTransaction<T = any>(
    connection: PoolConnection,
    sql: string,
    params?: any[],
  ): Promise<T[]> {
    const [rows] = await connection.query(sql, params);
    return rows as T[];
  }

  /**
   * 提交事务
   * @param connection 事务连接
   */
  public async commit(connection: PoolConnection): Promise<void> {
    try {
      await connection.commit();
    } finally {
      connection.release();
    }
  }

  /**
   * 回滚事务
   * @param connection 事务连接
   */
  public async rollback(connection: PoolConnection): Promise<void> {
    try {
      await connection.rollback();
    } finally {
      connection.release();
    }
  }

  /**
   * 关闭数据库连接池
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
