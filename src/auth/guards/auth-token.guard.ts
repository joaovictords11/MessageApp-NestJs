import {
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { REQUEST_TOKEN_PAYLOAD_KEY } from "../auth.constants";
import jwtConfig from "../config/jwt.config";

export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    const isValidToken = token && token.length > 0;

    if (!isValidToken) {
      throw new UnauthorizedException("Token is missing or invalid");
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration
      );

      const user = await this.userRepository.findOneBy({
        id: payload.sub,
        active: true,
      });

      if (!user) {
        throw new UnauthorizedException("User not allowed");
      }

      // payload["routePolicies"] = user.routePolicies;

      request[REQUEST_TOKEN_PAYLOAD_KEY] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Error to validate token");
    }
  }

  extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== "string") {
      return null;
    }

    return authHeader.split(" ")[1];
  }
}
