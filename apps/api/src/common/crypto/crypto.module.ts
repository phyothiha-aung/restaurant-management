import { Global, Module } from '@nestjs/common';
import { HashingProvider } from './provider/hashing.provider.js';
import { BcryptProvider } from './provider/bcrypt.provider.js';

@Global()
@Module({
  providers: [
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
  ],
  exports: [HashingProvider],
})
export class CryptoModule {}
