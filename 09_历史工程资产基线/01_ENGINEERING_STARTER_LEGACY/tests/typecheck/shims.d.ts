declare module "pg" {
  export interface QueryConfig { text: string; values?: unknown[]; }
  export interface QueryResult<R=any> { rows: R[]; rowCount: number | null; }
  export interface Pool { query<R=any>(query: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>; }
  export interface PoolClient { query<R=any>(query: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>; }
  const pg: { Pool: new (config?: unknown) => Pool };
  export default pg;
}
declare module "fastify" {
  export interface FastifyRequest { principal?: import("../../apps/api/src/core/authz.js").Principal; params?: unknown; }
  export interface FastifyInstance {
    db: import("pg").Pool;
    get(path:string,handler:(request:FastifyRequest)=>unknown|Promise<unknown>):unknown;
  }
}
