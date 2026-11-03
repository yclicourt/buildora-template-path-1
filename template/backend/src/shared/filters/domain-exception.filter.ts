import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../domain/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.httpStatus).json({
      statusCode: exception.httpStatus,
      code: exception.code,
      message: exception.message,
      ...(exception.details ? { details: exception.details } : {}),
    });
  }
}
