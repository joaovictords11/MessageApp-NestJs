import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TokenPayloadDto } from "src/auth/dto/token-payload.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { User } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { CreateMessageDto } from "./dto/create-message.dto";
import { ResponseMessageDto } from "./dto/response-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { Message } from "./entities/message.entity";

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService
  ) {}

  throwNotFoundException() {
    throw new NotFoundException("Message not found");
  }

  async findAll(paginationDto: PaginationDto): Promise<ResponseMessageDto[]> {
    const { limit = 10, page = 1 } = paginationDto;
    const offset = (page - 1) * limit; // Pular os registros já exibidos

    return await this.messageRepository.find({
      take: limit, // Quantos registros serão exibidos por página
      skip: offset, // Quantos registros serão pulados
      // A PAGINAÇÃO É A COMBINAÇÃO ENTRE O LIMIT E O OFFSET
      order: { createdAt: "DESC" },
      relations: ["from", "to"],
      select: {
        from: { id: true, name: true },
        to: { id: true, name: true },
      },
    });
  }

  async findOne(id: number): Promise<ResponseMessageDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ["from", "to"],
      select: {
        from: { id: true, name: true },
        to: { id: true, name: true },
      },
    });

    if (!message) {
      //throw new HttpException("Message not found", HttpStatus.NOT_FOUND);
      this.throwNotFoundException();
    }

    return message!;
  }

  async create(
    createMessageDto: CreateMessageDto,
    tokenPayload: TokenPayloadDto
  ): Promise<ResponseMessageDto> {
    const { toId, content } = createMessageDto;

    const from = (await this.usersService.findOne(tokenPayload.sub)) as User;

    const to = (await this.usersService.findOne(toId)) as User;

    const newMessage = {
      content,
      from,
      to,
      read: false,
      date: new Date(),
    };

    const message = await this.messageRepository.create(newMessage);
    await this.messageRepository.save(message);

    return {
      ...message,
      from: {
        id: message.from.id,
        name: message.from.name,
      },
      to: {
        id: message.to.id,
        name: message.to.name,
      },
    };
  }

  async update(
    id: number,
    updateMessageDto: UpdateMessageDto,
    tokenPayload: TokenPayloadDto
  ): Promise<ResponseMessageDto> {
    const message = await this.findOne(id);

    if (message?.from.id !== tokenPayload.sub) {
      throw new ForbiddenException("You cannot update this message");
    }

    if (message?.read === true) {
      throw new ForbiddenException("You cannot update a read message");
    }

    message!.content = updateMessageDto?.content ?? message!.content;
    message!.read = updateMessageDto?.read ?? message!.read;

    await this.messageRepository.save(message!);

    return message;
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const message = await this.findOne(id);

    if (message?.from.id !== tokenPayload.sub) {
      throw new ForbiddenException("You cannot delete this message");
    }

    if (message.read === true) {
      throw new ForbiddenException("You cannot delete a read message");
    }

    await this.messageRepository.delete(id);

    return { message: "Message deleted successfully" };
  }
}
