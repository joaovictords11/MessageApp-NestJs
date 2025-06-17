import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import jwtConfig from "./config/jwt.config";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { HashingService } from "./hashing/hashing.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService
  ) {}

  throwUnauthorizedException() {
    throw new UnauthorizedException("User or password incorrect");
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOneBy({
      email: loginDto.email,
      active: true,
    });

    if (!user) {
      throw new UnauthorizedException("User not allowed to login");
    }

    const isPasswordValid = await this.hashingService.comparePassword(
      loginDto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return this.throwUnauthorizedException();
    }

    return await this.createTokens(user);
  }

  private async createTokens(user: User) {
    const accessToken = await this.signJwtAsync<Partial<User>>(
      user.id,
      this.jwtConfiguration.expiresIn,
      {
        email: user.email,
      }
    );

    const refreshToken = await this.signJwtAsync(
      user.id,
      this.jwtConfiguration.refreshTokenExpiresIn
    );

    return { accessToken, refreshToken };
  }

  private async signJwtAsync<T>(sub: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn,
      }
    );
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        this.jwtConfiguration
      );

      const user = await this.userRepository.findOneBy({
        id: sub,
        active: true,
      });

      if (!user) {
        throw new Error("User not allowed");
      }

      return await this.createTokens(user);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
