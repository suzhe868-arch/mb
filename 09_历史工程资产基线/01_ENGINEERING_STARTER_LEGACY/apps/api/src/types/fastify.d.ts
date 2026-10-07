import type pg from "pg";
import type { Principal } from "../core/authz.js";
declare module "fastify" {
  interface FastifyInstance { db: pg.Pool; }
  interface FastifyRequest { principal?: Principal; }
}
