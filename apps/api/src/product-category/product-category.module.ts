import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { ProductCategoryController } from './product-category.controller.js';
import { ProductCategoryService } from './providers/product-category.service.js';

@Module({
  imports: [UserModule],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
})
export class ProductCategoryModule {}
