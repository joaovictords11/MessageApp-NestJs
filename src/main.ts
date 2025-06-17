import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app/app.module";
import { ParseIntIdPipe } from "./common/pipes/parse-int-id.pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove chaves que não estão no DTO
      forbidNonWhitelisted: true, // Retorna erro se chaves não estão no DTO
      transform: false, // Tenta transformar os dados de param para o tipo correto
    }),
    new ParseIntIdPipe() // Custom pipe to parse int id from params
  );

  if (process.env.NODE_ENV === "production") {
    //helmet -> cabeçalhos de segurança no protocolo HTTP
    app.use(helmet());
    //cors -> permite que outro domínio acesse a API
    app.enableCors();
  }

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
