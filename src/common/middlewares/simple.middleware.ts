// Cliente (Navegador) -> Servidor (Express) -> Middleware (Request, Response) ->
// -> NestJS (Guard, Interceptor, Pipe) -> Controller (Request, Response) -> Service (Business Logic) ->
// -> Repository (Database)

import { BadRequestException, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export class SimpleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log("Simple Middleware");
    const authorization = req.headers?.authorization;

    if (authorization) {
      req["user"] = {
        nome: "Lucas",
        sobrenome: "Lima",
        role: "admin",
      };

      return next();
    }

    throw new BadRequestException("Token not found");
  }
}
