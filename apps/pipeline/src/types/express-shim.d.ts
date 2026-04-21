// Minimal shim for scaffold-time type checking (express + Node globals).
// Replace with @types/express and @types/node once `pnpm install` is run.

// Node globals
declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};

declare const process: {
  env: Record<string, string | undefined>;
};

declare const crypto: {
  randomUUID(): string;
};

declare module "express" {
  interface Request<
    P = unknown,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown,
  > {
    body: ReqBody;
    params: P;
    query: ReqQuery;
  }

  interface Response<ResBody = unknown> {
    json(body: ResBody): this;
    status(code: number): this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type RouteHandler = (req: Request<any, any, any, any>, res: Response<any>) => void;

  interface Application {
    use(...args: unknown[]): this;
    get(path: string, handler: RouteHandler): this;
    post(path: string, handler: RouteHandler): this;
    listen(port: string | number, cb?: () => void): unknown;
  }

  interface ExpressStatic {
    (): Application;
    json(): unknown;
  }

  const express: ExpressStatic;
  export = express;
  export type { Request, Response, Application };
}
