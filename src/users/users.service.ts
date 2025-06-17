import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as fs from "fs/promises";
import * as path from "path";
import { TokenPayloadDto } from "src/auth/dto/token-payload.dto";
import { HashingService } from "src/auth/hashing/hashing.service";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService
  ) {}

  throwNotFoundException() {
    throw new NotFoundException("User not found");
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password
      );

      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
      };

      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictException("Email already registered");
      }

      throw error;
    }
  }

  async findAll() {
    return await this.userRepository.find({
      select: [
        "id",
        "name",
        "email",
        "createdAt",
        "updatedAt",
        "messagesSent",
        "messagesReceived",
      ],
      relations: ["messagesSent", "messagesReceived"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        "id",
        "name",
        "email",
        "createdAt",
        "updatedAt",
        "messagesSent",
        "messagesReceived",
      ],
      relations: ["messagesSent", "messagesReceived"],
    });

    if (!user) {
      this.throwNotFoundException();
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    tokenPayload: TokenPayloadDto
  ) {
    const userData = {
      name: updateUserDto?.name,
    };

    if (updateUserDto?.password) {
      userData["passwordHash"] = await this.hashingService.hash(
        updateUserDto.password
      );
    }

    const user = await this.userRepository.preload({ id, ...userData });

    if (!user) {
      return this.throwNotFoundException();
    }

    if (user.id !== tokenPayload.sub) {
      throw new ForbiddenException("You cannot update this user");
    }

    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.throwNotFoundException();
      return;
    }

    if (user.id !== tokenPayload.sub) {
      throw new ForbiddenException("You cannot delete this user");
    }

    await this.userRepository.delete(id);

    return { message: "User deleted successfully" };
  }

  async uploadPicture(
    file: Express.Multer.File,
    tokenPayload: TokenPayloadDto
  ) {
    if (file.size < 1024) {
      throw new BadRequestException("File is too small");
    }

    const user = await this.userRepository.findOne({
      where: { id: tokenPayload.sub },
    });

    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);

    const fileName = `${tokenPayload.sub}.${fileExtension}`;

    const uploadPath = path.resolve(process.cwd(), "pictures", fileName);

    await fs.writeFile(uploadPath, file.buffer);

    user!.picture = fileName;
    await this.userRepository.save(user!);

    return user;
  }
}
