import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { UserModule } from '../user/user.module.js';
import { ProductController } from './product.controller.js';
import { ProductService } from './providers/product.service.js';
import { ProductImageService } from './providers/product-image.service.js';

@Module({
  imports: [PaginationModule, StorageModule, UserModule],
  controllers: [ProductController],
  providers: [ProductService, ProductImageService],
})
export class ProductModule {}
