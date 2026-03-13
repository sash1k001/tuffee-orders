import { Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { throwError } from "rxjs";

@Catch(HttpException)
export class HttpToRpcExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException) {
        const status = exception.getStatus();
        const response = exception.getResponse();

        const message = typeof response === 'string' ? response : (response as any).message || exception.message;

        return throwError(() => new RpcException({
            statusCode: status,
            message: message,
            error: exception.name,
        }));
    }
}