import { BadRequestException, PipeTransform, Type } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from '../../common/lib/zod.js';

export const ZodValidationPipe: Type<PipeTransform> = createZodValidationPipe({
  createValidationException: (error) => {
    if (error instanceof ZodError) {
      const firstMessage = error.issues[0]?.message ?? 'Validation failed';

      return new BadRequestException(firstMessage);
    }

    return new BadRequestException('Validation failed');
  },
});
