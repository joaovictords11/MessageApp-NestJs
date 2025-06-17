import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as fs from "fs/promises";
import * as path from "path";
import { HashingService } from "src/auth/hashing/hashing.service";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

jest.mock("fs/promises"); // Mock fs/promises for file operations

describe("UsersService", () => {
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let hashingService: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    hashingService = module.get<HashingService>(HashingService);
  });

  it("should be defined", () => {
    expect(usersService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(hashingService).toBeDefined();
  });

  describe("create", () => {
    it("should create a user successfully", async () => {
      //Arange

      const createUserDto: CreateUserDto = {
        name: "João",
        email: "joao@gmail.com",
        password: "joao123",
      };

      const passwordHash = "hashedPassword";

      const newUser = {
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
      };

      // Como o valor retornado por hashingService.hash é necessário
      // vamos simular este valor.
      jest.spyOn(hashingService, "hash").mockResolvedValue(passwordHash);

      // Como o user retornado por userRepository.create é necessária em
      // userRepository.save. Vamos simular este valor.
      jest.spyOn(userRepository, "create").mockReturnValue(newUser as any);

      // Act
      const result = await usersService.create(createUserDto);

      // Assert

      // O método hashingService.hash foi chamado com createUserDto.password?
      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password);

      // O método userRepository.create foi chamado com os dados do novo
      // user com o hash de senha gerado por hashingService.hash?
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: "hashedPassword",
      });

      // O método userRepository.save foi chamado com os dados do novo
      // user gerado por userRepository.create?
      expect(userRepository.save).toHaveBeenCalledWith(newUser);

      // O resultado do método usersService.create retornou o novo
      // user criado?
      expect(result).toEqual(newUser);
    });

    it("should throw ConflictException if email already exists", async () => {
      jest.spyOn(userRepository, "save").mockRejectedValue({
        code: "23505", // Unique constraint violation
      });

      await expect(usersService.create({} as any)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw a Generic error", async () => {
      jest
        .spyOn(userRepository, "save")
        .mockRejectedValue(new Error("Generic error"));

      await expect(usersService.create({} as any)).rejects.toThrow(Error);
    });
  });

  describe("findOne", () => {
    it("should find a user by id", async () => {
      const userId = 1;

      const user = {
        id: userId,
        name: "João",
        email: "joao@gmail.com",
        passwordHash: "hashedPassword",
      };

      jest.spyOn(userRepository, "findOne").mockResolvedValue(user as any);

      const result = await usersService.findOne(userId);

      expect(result).toEqual(user);
    });

    it("should throw NotFoundException if user does not exist", async () => {
      await expect(usersService.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const users: User[] = [
        {
          id: 1,
          name: "João",
          email: "joao@gmail.com",
          passwordHash: "hashedPassword",
          messagesSent: [],
          messagesReceived: [],
          active: true,
          picture: "",
        },
      ];

      jest.spyOn(userRepository, "find").mockResolvedValue(users);

      const result = await usersService.findAll();

      expect(result).toEqual(users);
    });
  });

  describe("update", () => {
    it("should update a user successfully", async () => {
      //Arrange
      const userId = 1;

      const updateUserDto = {
        name: "João",
        password: "password",
      };

      const tokenPayload = { sub: userId };
      const passwordHash = "hashedPassword";

      const updatedUser = {
        id: userId,
        name: updateUserDto.name,
        passwordHash,
      };

      jest.spyOn(hashingService, "hash").mockResolvedValueOnce(passwordHash);
      jest
        .spyOn(userRepository, "preload")
        .mockResolvedValueOnce(updatedUser as any);
      jest
        .spyOn(userRepository, "save")
        .mockResolvedValueOnce(updatedUser as any);

      //Act
      const result = await usersService.update(
        userId,
        updateUserDto,
        tokenPayload as any
      );

      //Assert
      expect(hashingService.hash).toHaveBeenCalledWith(updateUserDto.password);
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: userId,
        name: updateUserDto.name,
        passwordHash,
      });
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it("should throw NotFoundException if user does not exist", async () => {
      const userId = 1;
      const updateUserDto = { name: "João" };
      const tokenPayload = { sub: userId };

      jest.spyOn(userRepository, "preload").mockResolvedValue(null as any);

      await expect(
        usersService.update(userId, updateUserDto, tokenPayload as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user tries to update another user", async () => {
      const userId = 1;
      const updateUserDto = { name: "João" };
      const tokenPayload = { sub: 2 }; // Different user ID

      jest.spyOn(userRepository, "preload").mockResolvedValue({
        id: userId,
        name: updateUserDto.name,
      } as any);

      await expect(
        usersService.update(userId, updateUserDto, tokenPayload as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("remove", () => {
    it("should remove a user successfully", async () => {
      const userId = 1;
      const tokenPayload = { sub: userId };

      const user = {
        id: userId,
        name: "João",
        email: "joao@gmail.com",
        passwordHash: "hashedPassword",
      };

      jest.spyOn(userRepository, "findOne").mockResolvedValue(user as any);
      jest.spyOn(userRepository, "delete").mockResolvedValue(user as any);

      const result = await usersService.remove(userId, tokenPayload as any);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    it("should throw NotFoundException if user does not exist", async () => {
      const userId = 1;
      const tokenPayload = { sub: userId };

      jest.spyOn(userRepository, "findOne").mockResolvedValue(null);

      await expect(
        usersService.remove(userId, tokenPayload as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user tries to remove another user", async () => {
      const userId = 1;
      const tokenPayload = { sub: 2 }; // Different user ID

      jest.spyOn(userRepository, "findOne").mockResolvedValue({
        id: userId,
        name: "João",
        email: "joao@gmail.com",
        passwordHash: "hashedPassword",
      } as any);

      await expect(
        usersService.remove(userId, tokenPayload as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("uploadPicture", () => {
    it("should upload a user picture successfully", async () => {
      //Arrange
      const mockFile = {
        filename: "test.png",
        originalname: "test.png",
        size: 2000,
        buffer: Buffer.from("file content"),
      } as Express.Multer.File;

      const mockUser = {
        id: 1,
        name: "João",
        email: "joao@gmail.com",
      } as User;

      const tokenPayload = { sub: 1 } as any;

      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...mockUser,
        picture: "1.png",
      });

      const filePath = path.resolve(process.cwd(), "pictures", "1.png");

      //Act
      const result = await usersService.uploadPicture(mockFile, tokenPayload);

      //Assert
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: tokenPayload.sub },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        picture: "1.png",
      });
      expect(result).toEqual({
        ...mockUser,
        picture: "1.png",
      });
    });

    it("should throw BadRequestException if file is smaller than 1024 bytes", async () => {
      //Arrange
      const mockFile = {
        filename: "test.png",
        originalname: "test.png",
        size: 500,
        buffer: Buffer.from("file content"),
      } as Express.Multer.File;
      const tokenPayload = { sub: 1 } as any;

      //Act and Assert
      await expect(
        usersService.uploadPicture(mockFile, tokenPayload)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if user does not exist", async () => {
      //Arrange
      const mockFile = {} as Express.Multer.File;
      const tokenPayload = { sub: 1 } as any;

      jest
        .spyOn(userRepository, "findOne")
        .mockRejectedValue(new NotFoundException());

      //Act and Assert
      await expect(
        usersService.uploadPicture(mockFile, tokenPayload)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
