import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { UserModule } from '../user/user.module.js';
import { ProductCategoryController } from './product-category.controller.js';
import { ProductCategoryService } from './providers/product-category.service.js';

@Module({
  imports: [PaginationModule, UserModule],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
})
export class ProductCategoryModule {}
