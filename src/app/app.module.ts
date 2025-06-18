import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";
import { AuthModule } from "src/auth/auth.module";
import { MessagesModule } from "../messages/messages.module";
import { UsersModule } from "../users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 10000, // Tempo de vida da janela de tempo em segundos
    //     limit: 10, // Número máximo de requisições permitidas por janela de tempo
    //     blockDuration: 5000, // Duração do bloqueio em milissegundos
    //   },
    // ]),
    ConfigModule.forRoot({
      //envFilePath: ".env",
    }),
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as "postgres",
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: Boolean(process.env.DATABASE_AUTOLOADENTITIES),
      synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE), // Use only in development
    }),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(process.cwd(), "pictures"),
      serveRoot: "/pictures",
    }),
    MessagesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard, // Global rate limiting guard
    // },
  ],
})
export class AppModule {}

// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(SimpleMiddleware).forRoutes("*");
//   }
// }
