import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('{{PROJECT_TITLE}} API')
  .setDescription('{{PROJECT_TITLE}} API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
