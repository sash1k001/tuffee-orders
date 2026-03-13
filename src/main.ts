import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { HttpToRpcExceptionFilter } from "./common/filters/http-to-rpc.filter.js";

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.TCP,
            options: {
                host: '0.0.0.0',
                port: 3003,
            },
        },
    );

    app.useGlobalFilters(new HttpToRpcExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    await app.listen();
    console.log('🚀 сервис заказов на порту 3003')
}

bootstrap();