import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";
import { AuthModule } from "src/auth/auth.module";
import { ParseIntIdPipe } from "src/common/pipes/parse-int-id.pipe";
import { MessagesModule } from "src/messages/messages.module";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { UsersModule } from "src/users/users.module";
import * as request from "supertest";
import { App } from "supertest/types";

const login = async (
  app: INestApplication,
  email: string,
  password: string
) => {
  const response = await request(app.getHttpServer())
    .post("/auth")
    .send({ email, password });

  return response.body.accessToken;
};

const createUserAndLogin = async (app: INestApplication) => {
  const createUserDto: CreateUserDto = {
    name: "Test User",
    email: "test@test.com",
    password: "password123",
  };

  await request(app.getHttpServer()).post("/users").send(createUserDto);

  return await login(app, createUserDto.email, createUserDto.password);
};

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          //envFilePath: ".env",
        }),
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: "postgres",
          password: process.env.DATABASE_PASSWORD,
          database: "test",
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        }),
        ServeStaticModule.forRoot({
          rootPath: path.resolve(process.cwd(), "pictures"),
          serveRoot: "/pictures",
        }),
        MessagesModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Remove chaves que não estão no DTO
        forbidNonWhitelisted: true, // Retorna erro se chaves não estão no DTO
        transform: false, // Tenta transformar os dados de param para o tipo correto
      }),
      new ParseIntIdPipe() // Custom pipe to parse int id from params
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/users (POST)", () => {
    it("should create a user", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      };

      const response = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(Number),
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: expect.any(String),
        picture: "",
        active: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should return ConflictException if email already exists", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      };
      await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toEqual({
        statusCode: HttpStatus.CONFLICT,
        message: "Email already registered",
        error: "Conflict",
      });
    });

    it("should return BadRequestException for small password", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "pass",
      };

      const response = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["password must be longer than or equal to 5 characters"],
        error: "Bad Request",
      });
    });
  });

  describe("/users (GET)", () => {
    it("should return UnauthorizedException if user is not authenticated", async () => {
      const userResponse = await request(app.getHttpServer())
        .post("/users")
        .send({
          name: "Test User",
          email: "test@test.com",
          password: "password123",
        })
        .expect(HttpStatus.CREATED);

      const userId = userResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Token is missing or invalid",
        error: "Unauthorized",
      });
    });

    it("should return an array of users if authenticated", async () => {
      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            messagesSent: expect.any(Array),
            messagesReceived: expect.any(Array),
          }),
        ])
      );
    });
  });

  describe("/users/:id (GET)", () => {
    it("should return the User if authenticated", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      };

      const userResponse = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const userId = userResponse.body.id;

      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: userId,
        name: "Test User",
        email: "test@test.com",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        messagesSent: expect.any(Array),
        messagesReceived: expect.any(Array),
      });
    });

    it("should return NotFoundException if user does not exist", async () => {
      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .get("/users/999999")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: "User not found",
        error: "Not Found",
      });
    });
  });

  describe("/users/:id (PATCH)", () => {
    it("should update the User if authenticated", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      };

      const userResponse = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const userId = userResponse.body.id;

      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Updated User" })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: userId,
        name: "Updated User",
        email: "test@test.com",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        passwordHash: expect.any(String),
        picture: "",
        active: true,
      });
    });

    it("should return NotFoundException if user does not exist", async () => {
      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .patch("/users/999999")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Updated User" })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: "User not found",
        error: "Not Found",
      });
    });
  });

  describe("/users/:id (DELETE)", () => {
    it("should delete the User if authenticated", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      };

      const userResponse = await request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const userId = userResponse.body.id;

      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        message: "User deleted successfully",
      });
    });

    it("should return NotFoundException if user does not exist", async () => {
      const accessToken = await createUserAndLogin(app);

      const response = await request(app.getHttpServer())
        .delete("/users/999999")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: "User not found",
        error: "Not Found",
      });
    });
  });
});
