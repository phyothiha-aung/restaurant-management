import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Paginated } from '../interfaces/paginated.interface.js';
import { PaginationQueryDto } from '../dtos/pagination-query-dto.js';

export interface PrismaDelegate<T> {
  findMany: (args: any) => Promise<T[]>;
  count: (args: any) => Promise<number>;
}

@Injectable({ scope: Scope.REQUEST })
export class PaginationProvider {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}

  public async paginateQuery<T>(
    paginationQuery: PaginationQueryDto,
    model: PrismaDelegate<T>,
    args: { where?: any; select?: any; include?: any; orderBy?: any } = {},
  ): Promise<Paginated<T>> {
    const page = paginationQuery.page;
    const limit = paginationQuery.limit;
    const skip = (page - 1) * limit;

    const [results, totalItems] = await Promise.all([
      model.findMany({
        ...args,
        skip,
        take: limit,
      }),
      model.count({ where: args.where }),
    ]);

    return this.buildPaginatedResponse(paginationQuery, results, totalItems);
  }

  public async paginateRawQuery<T>(
    paginationQuery: PaginationQueryDto,
    fetchQueryFn: (skip: number, take: number) => Promise<T[]>,
    countQueryFn: () => Promise<number>,
  ): Promise<Paginated<T>> {
    const page = paginationQuery.page;
    const limit = paginationQuery.limit;
    const skip = (page - 1) * limit;

    const [results, totalItems] = await Promise.all([
      fetchQueryFn(skip, limit),
      countQueryFn(),
    ]);

    return this.buildPaginatedResponse(paginationQuery, results, totalItems);
  }

  private buildPaginatedResponse<T>(
    paginationQuery: PaginationQueryDto,
    results: T[],
    totalItems: number,
  ): Paginated<T> {
    const host = this.request.headers.host;
    const protocol = this.request.protocol;
    const baseURL = `${protocol}://${host}`;
    const url = new URL(this.request.url ?? '', baseURL);

    const totalPages = Math.ceil(totalItems / paginationQuery.limit) || 1;
    const nextPage =
      paginationQuery.page >= totalPages ? null : paginationQuery.page + 1;

    const previousPage =
      paginationQuery.page <= 1 ? null : paginationQuery.page - 1;

    const getPaginationLink = (page: number | null) => {
      if (page === null) return null;

      const searchParams = new URLSearchParams(url.search);
      searchParams.set('page', page.toString());
      searchParams.set('limit', paginationQuery.limit.toString());

      return `${url.origin}${url.pathname}?${searchParams.toString()}`;
    };

    return {
      data: results,
      meta: {
        itemsPerPage: paginationQuery.limit,
        totalItems: totalItems,
        currentPage: paginationQuery.page,
        totalPages: totalPages,
      },
      links: {
        first: getPaginationLink(1)!,
        last: getPaginationLink(totalPages)!,
        current: getPaginationLink(paginationQuery.page)!,
        previous: getPaginationLink(previousPage),
        next: getPaginationLink(nextPage),
      },
    };
  }
}
