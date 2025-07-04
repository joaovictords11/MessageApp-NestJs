import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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

  app.enableShutdownHooks();

  if (process.env.NODE_ENV === "production") {
    //helmet -> cabeçalhos de segurança no protocolo HTTP
    app.use(helmet());
    //cors -> permite que outro domínio acesse a API
    app.enableCors();
  }

  const documentBuilderConfig = new DocumentBuilder()
    .setTitle("Message App")
    .setDescription("API para envio de mensagens")
    .setVersion("1.0")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    })
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilderConfig);

  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port, "::");
}
bootstrap();
