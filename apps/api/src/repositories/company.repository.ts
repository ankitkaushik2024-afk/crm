import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export class CompanyRepository {
  async findBySlug(slug: string) {
    return prisma.company.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    settings?: Prisma.CompanySettingsCreateWithoutCompanyInput;
    subscription?: Prisma.SubscriptionCreateWithoutCompanyInput;
  }) {
    return prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: data.settings ? { create: data.settings } : undefined,
        subscription: data.subscription ? { create: data.subscription } : undefined,
      },
    });
  }
}

export const companyRepository = new CompanyRepository();
