import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MarketplaceCategory } from './entities/marketplace-category.entity';
import { MarketplaceProvider } from './entities/marketplace-provider.entity';
import { CreateMarketplaceProviderDto } from './dto/create-marketplace-provider.dto';
import { UpdateMarketplaceProviderDto } from './dto/update-marketplace-provider.dto';
import { AdminMarketplaceQueryDto } from '../admin/dto/admin-marketplace-query.dto';
import { CreateMarketplaceDraftDto } from './dto/create-marketplace-draft.dto';
import { MarketplaceProviderStatus } from './enums/marketplace-provider-status.enum';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceCategory)
    private readonly categoriesRepository: Repository<MarketplaceCategory>,
    @InjectRepository(MarketplaceProvider)
    private readonly providersRepository: Repository<MarketplaceProvider>,
  ) {}

  async ensureDefaults() {
    const categoryCount = await this.categoriesRepository.count();

    if (categoryCount === 0) {
      await this.categoriesRepository.save([
        this.categoriesRepository.create({
          code: 'ecommerce',
          name: 'E-Commerce',
          description: 'Local vendors, online stores, and artisans paid in CDF.',
          rolloutPhase: 2,
          displayOrder: 2,
          isActive: true,
        }),
        this.categoriesRepository.create({
          code: 'bills_utilities',
          name: 'Bills & Utilities',
          description: 'Pay utilities, telecom, and subscriptions.',
          rolloutPhase: 1,
          displayOrder: 1,
          isActive: true,
        }),
        this.categoriesRepository.create({
          code: 'financial_services',
          name: 'Financial Services',
          description: 'Insurance, microfinance, and fintech account services.',
          rolloutPhase: 2,
          displayOrder: 3,
          isActive: true,
        }),
        this.categoriesRepository.create({
          code: 'betting_gaming',
          name: 'Betting & Gaming',
          description: 'Top up approved gaming and betting wallets.',
          rolloutPhase: 3,
          displayOrder: 5,
          isActive: true,
        }),
        this.categoriesRepository.create({
          code: 'fintech_platforms',
          name: 'Fintech & Digital Platforms',
          description: 'Cross-wallet and partner platform integrations.',
          rolloutPhase: 2,
          displayOrder: 4,
          isActive: true,
        }),
      ]);
    }

    const providerCount = await this.providersRepository.count();
    if (providerCount === 0) {
      const categories = await this.categoriesRepository.find();
      const byCode = new Map(categories.map((item) => [item.code, item]));
      await this.providersRepository.save([
        this.providersRepository.create({
          name: 'SNEL',
          slug: 'snel',
          category: byCode.get('bills_utilities'),
          description: 'Utility bill payments for SNEL.',
          integrationType: 'SOAP',
          apiBaseUrl: null,
          authType: null,
          status: MarketplaceProviderStatus.ACTIVE,
          isVisible: true,
          supportsAccountLinking: false,
          averageConfirmationSeconds: 2,
          metadataJson: null,
        }),
        this.providersRepository.create({
          name: 'REGIDESO',
          slug: 'regideso',
          category: byCode.get('bills_utilities'),
          description: 'Water utility bill payments.',
          integrationType: 'SOAP',
          apiBaseUrl: null,
          authType: null,
          status: MarketplaceProviderStatus.ACTIVE,
          isVisible: true,
          supportsAccountLinking: false,
          averageConfirmationSeconds: 3,
          metadataJson: null,
        }),
      ]);
    }
  }

  async getOverview() {
    await this.ensureDefaults();
    const [categories, providers] = await Promise.all([
      this.categoriesRepository.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
      }),
      this.providersRepository.find({
        where: { isVisible: true },
        relations: { category: true },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return {
      categories: categories.map((category) => ({
        code: category.code,
        name: category.name,
        description: category.description,
        rolloutPhase: category.rolloutPhase,
      })),
      providers: providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        category: provider.category.code,
        status: provider.status,
        integrationType: provider.integrationType,
        averageConfirmationSeconds: provider.averageConfirmationSeconds,
        supportsAccountLinking: provider.supportsAccountLinking,
      })),
      linkedAccounts: [],
      recentTransactions: [],
    };
  }

  async listVisibleProviders() {
    await this.ensureDefaults();
    const providers = await this.providersRepository.find({
      where: { isVisible: true },
      relations: { category: true },
      order: { createdAt: 'ASC' },
    });

    return providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: provider.category.code,
      status: provider.status,
      integrationType: provider.integrationType,
      averageConfirmationSeconds: provider.averageConfirmationSeconds,
      supportsAccountLinking: provider.supportsAccountLinking,
    }));
  }

  async createTransactionDraft(body: CreateMarketplaceDraftDto) {
    const provider = await this.providersRepository.findOne({
      where: { id: body.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Marketplace provider not found');
    }

    return {
      id: `draft-${Date.now()}`,
      providerId: body.providerId,
      serviceName: body.serviceName,
      reference: body.reference,
      amountCDF: body.amountCDF,
      feesCDF: Math.ceil(body.amountCDF * 0.02),
      status: 'draft',
      createdAt: new Date().toISOString(),
      steps: [
        { key: 'service_selection', label: 'Service selection', status: 'done' },
        { key: 'amount_fetch', label: 'Bill / amount fetch', status: 'done' },
        {
          key: 'wallet_pre_authorization',
          label: 'Wallet pre-authorisation',
          status: 'in_progress',
        },
        { key: 'user_confirmation', label: 'User confirmation', status: 'idle' },
        { key: 'wallet_debit', label: 'Wallet debit', status: 'idle' },
        { key: 'provider_settlement', label: 'Provider settlement', status: 'idle' },
        { key: 'receipt_generation', label: 'Receipt generation', status: 'idle' },
      ],
    };
  }

  async listAdminProviders(query: AdminMarketplaceQueryDto) {
    await this.ensureDefaults();
    const qb = this.providersRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.category', 'category')
      .orderBy('provider.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(provider.name ILIKE :search OR provider.slug ILIKE :search OR category.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.categoryCode) {
      qb.andWhere('category.code = :categoryCode', {
        categoryCode: query.categoryCode,
      });
    }

    if (query.status) {
      qb.andWhere('provider.status = :status', { status: query.status });
    }

    if (query.visibility) {
      qb.andWhere('provider.isVisible = :isVisible', {
        isVisible: query.visibility === 'visible',
      });
    }

    const paginated = await this.paginate(qb, query.page ?? 1, query.limit ?? 20);
    return {
      ...paginated,
      items: paginated.items.map((item) => this.serializeProvider(item)),
    };
  }

  async listAdminCategories() {
    await this.ensureDefaults();
    return this.categoriesRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createProvider(body: CreateMarketplaceProviderDto) {
    const category = await this.categoriesRepository.findOne({
      where: { code: body.categoryCode },
    });

    if (!category) {
      throw new NotFoundException('Marketplace category not found');
    }

    const provider = this.providersRepository.create({
      name: body.name,
      slug: body.slug,
      category,
      description: body.description ?? null,
      integrationType: body.integrationType,
      apiBaseUrl: body.apiBaseUrl ?? null,
      authType: body.authType ?? null,
      status: (body.status as MarketplaceProviderStatus) ?? MarketplaceProviderStatus.PENDING,
      isVisible: body.isVisible ?? true,
      supportsAccountLinking: body.supportsAccountLinking ?? false,
      averageConfirmationSeconds: body.averageConfirmationSeconds ?? 2,
      metadataJson: null,
    });

    const savedProvider = await this.providersRepository.save(provider);
    const hydratedProvider = await this.providersRepository.findOne({
      where: { id: savedProvider.id },
      relations: { category: true },
    });
    return this.serializeProvider(hydratedProvider!);
  }

  async updateProvider(id: string, body: UpdateMarketplaceProviderDto) {
    const provider = await this.providersRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!provider) {
      throw new NotFoundException('Marketplace provider not found');
    }

    if (body.categoryCode) {
      const category = await this.categoriesRepository.findOne({
        where: { code: body.categoryCode },
      });

      if (!category) {
        throw new NotFoundException('Marketplace category not found');
      }

      provider.category = category;
    }

    Object.assign(provider, {
      name: body.name ?? provider.name,
      slug: body.slug ?? provider.slug,
      description: body.description ?? provider.description,
      integrationType: body.integrationType ?? provider.integrationType,
      apiBaseUrl: body.apiBaseUrl ?? provider.apiBaseUrl,
      authType: body.authType ?? provider.authType,
      status: (body.status as MarketplaceProviderStatus) ?? provider.status,
      isVisible: body.isVisible ?? provider.isVisible,
      supportsAccountLinking:
        body.supportsAccountLinking ?? provider.supportsAccountLinking,
      averageConfirmationSeconds:
        body.averageConfirmationSeconds ?? provider.averageConfirmationSeconds,
    });

    const savedProvider = await this.providersRepository.save(provider);
    const hydratedProvider = await this.providersRepository.findOne({
      where: { id: savedProvider.id },
      relations: { category: true },
    });
    return this.serializeProvider(hydratedProvider!);
  }

  async updateProviderVisibility(id: string, isVisible: boolean) {
    const provider = await this.providersRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Marketplace provider not found');
    }
    provider.isVisible = isVisible;
    const savedProvider = await this.providersRepository.save(provider);
    const hydratedProvider = await this.providersRepository.findOne({
      where: { id: savedProvider.id },
      relations: { category: true },
    });
    return this.serializeProvider(hydratedProvider!);
  }

  async updateProviderStatus(id: string, status: MarketplaceProviderStatus) {
    const provider = await this.providersRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Marketplace provider not found');
    }
    provider.status = status;
    const savedProvider = await this.providersRepository.save(provider);
    const hydratedProvider = await this.providersRepository.findOne({
      where: { id: savedProvider.id },
      relations: { category: true },
    });
    return this.serializeProvider(hydratedProvider!);
  }

  private async paginate(
    qb: SelectQueryBuilder<MarketplaceProvider>,
    page: number,
    limit: number,
  ) {
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  private serializeProvider(provider: MarketplaceProvider) {
    return {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      category: provider.category.code,
      description: provider.description ?? undefined,
      integrationType: provider.integrationType,
      apiBaseUrl: provider.apiBaseUrl,
      authType: provider.authType,
      status: provider.status,
      isVisible: provider.isVisible,
      supportsAccountLinking: provider.supportsAccountLinking,
      averageConfirmationSeconds: provider.averageConfirmationSeconds,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
