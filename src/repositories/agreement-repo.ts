import { AgreementStatus, MilestoneStatus } from '@prisma/client';
import { prisma, checkDatabaseHealth } from '../services/db.js';

export interface MilestoneData {
  index: number;
  description: string;
  amount: string;
  status?: MilestoneStatus;
  proofHash?: string;
  submittedAt?: Date;
  approvedAt?: Date;
}

export interface AgreementData {
  onChainId: bigint;
  clientAddress: string;
  providerAddress: string;
  arbiterAddress: string;
  tokenAddress: string;
  totalAmount: string;
  balance: string;
  status: AgreementStatus;
  deadline: Date;
  title?: string;
  description?: string;
  metadataCid?: string;
  milestones?: MilestoneData[];
}

export interface AgreementQueryFilters {
  clientAddress?: string;
  providerAddress?: string;
  status?: AgreementStatus;
  limit?: number;
  offset?: number;
}

export interface PlatformStats {
  totalAgreements: number;
  totalVolume: string;
  activeEscrows: number;
  completedAgreements: number;
  disputedAgreements: number;
  totalMilestones: number;
}

export class AgreementRepository {
  private inMemoryAgreements: Map<string, AgreementData & { id: string; createdAt: Date; updatedAt: Date }> = new Map();
  private inMemoryEvents: any[] = [];
  private useDatabase: boolean | null = null;

  public async isDatabaseAvailable(): Promise<boolean> {
    if (this.useDatabase !== null) return this.useDatabase;
    const health = await checkDatabaseHealth();
    this.useDatabase = health.isHealthy;
    return this.useDatabase;
  }

  public setUseDatabase(value: boolean) {
    this.useDatabase = value;
  }

  public async upsertAgreement(data: AgreementData) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      return prisma.agreement.upsert({
        where: { onChainId: data.onChainId },
        update: {
          clientAddress: data.clientAddress,
          providerAddress: data.providerAddress,
          arbiterAddress: data.arbiterAddress,
          tokenAddress: data.tokenAddress,
          totalAmount: data.totalAmount,
          balance: data.balance,
          status: data.status,
          deadline: data.deadline,
          title: data.title,
          description: data.description,
          metadataCid: data.metadataCid,
        },
        create: {
          onChainId: data.onChainId,
          clientAddress: data.clientAddress,
          providerAddress: data.providerAddress,
          arbiterAddress: data.arbiterAddress,
          tokenAddress: data.tokenAddress,
          totalAmount: data.totalAmount,
          balance: data.balance,
          status: data.status,
          deadline: data.deadline,
          title: data.title,
          description: data.description,
          metadataCid: data.metadataCid,
          milestones: data.milestones
            ? {
                create: data.milestones.map((m) => ({
                  index: m.index,
                  description: m.description,
                  amount: m.amount,
                  status: m.status || MilestoneStatus.PENDING,
                })),
              }
            : undefined,
        },
        include: {
          milestones: { orderBy: { index: 'asc' } },
        },
      });
    }

    const key = data.onChainId.toString();
    const existing = this.inMemoryAgreements.get(key);
    const now = new Date();
    const record = {
      ...data,
      id: existing ? existing.id : `mem-${key}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      milestones: data.milestones || existing?.milestones || [],
    };
    this.inMemoryAgreements.set(key, record);
    return record;
  }

  public async updateMilestoneRejection(onChainId: bigint, index: number, _feedbackHash: string) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      const agreement = await prisma.agreement.findUnique({ where: { onChainId } });
      if (!agreement) return null;
      return prisma.milestone.update({
        where: { agreementId_index: { agreementId: agreement.id, index } },
        data: { status: MilestoneStatus.PENDING, proofHash: '' },
      });
    }

    const key = onChainId.toString();
    const agreement = this.inMemoryAgreements.get(key);
    if (!agreement) return null;
    const milestone = agreement.milestones?.find((m) => m.index === index);
    if (milestone) {
      milestone.status = MilestoneStatus.PENDING;
      milestone.proofHash = '';
      agreement.updatedAt = new Date();
    }
    return milestone;
  }

  public async updateAgreementArbiter(onChainId: bigint, newArbiter: string) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      return prisma.agreement.update({
        where: { onChainId },
        data: { arbiterAddress: newArbiter },
      });
    }

    const key = onChainId.toString();
    const agreement = this.inMemoryAgreements.get(key);
    if (agreement) {
      agreement.arbiterAddress = newArbiter;
      agreement.updatedAt = new Date();
      this.inMemoryAgreements.set(key, agreement);
    }
    return agreement;
  }

  public async updateAgreementStatus(onChainId: bigint, status: AgreementStatus, newBalance?: string) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      return prisma.agreement.update({
        where: { onChainId },
        data: {
          status,
          ...(newBalance !== undefined ? { balance: newBalance } : {}),
        },
      });
    }

    const key = onChainId.toString();
    const agreement = this.inMemoryAgreements.get(key);
    if (agreement) {
      agreement.status = status;
      if (newBalance !== undefined) {
        agreement.balance = newBalance;
      }
      agreement.updatedAt = new Date();
      this.inMemoryAgreements.set(key, agreement);
    }
    return agreement;
  }

  public async updateMilestoneStatus(
    onChainId: bigint,
    index: number,
    status: MilestoneStatus,
    proofHash?: string
  ) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      const agreement = await prisma.agreement.findUnique({
        where: { onChainId },
      });
      if (!agreement) return null;

      return prisma.milestone.upsert({
        where: {
          agreementId_index: {
            agreementId: agreement.id,
            index,
          },
        },
        update: {
          status,
          ...(proofHash ? { proofHash } : {}),
          ...(status === MilestoneStatus.SUBMITTED ? { submittedAt: new Date() } : {}),
          ...(status === MilestoneStatus.APPROVED ? { approvedAt: new Date() } : {}),
        },
        create: {
          agreementId: agreement.id,
          index,
          description: `Milestone #${index + 1}`,
          amount: '0',
          status,
          proofHash,
          submittedAt: status === MilestoneStatus.SUBMITTED ? new Date() : undefined,
          approvedAt: status === MilestoneStatus.APPROVED ? new Date() : undefined,
        },
      });
    }

    const key = onChainId.toString();
    const agreement = this.inMemoryAgreements.get(key);
    if (!agreement) return null;

    let milestone = agreement.milestones?.find((m) => m.index === index);
    if (!milestone) {
      milestone = {
        index,
        description: `Milestone #${index + 1}`,
        amount: '0',
        status,
        proofHash,
      };
      agreement.milestones = agreement.milestones || [];
      agreement.milestones.push(milestone);
    } else {
      milestone.status = status;
      if (proofHash) milestone.proofHash = proofHash;
      if (status === MilestoneStatus.SUBMITTED) milestone.submittedAt = new Date();
      if (status === MilestoneStatus.APPROVED) milestone.approvedAt = new Date();
    }
    return milestone;
  }

  public async getAgreementsByParty(address: string, role?: 'client' | 'provider' | 'arbiter', limit = 20, offset = 0) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      const where: any = role === 'client'
        ? { clientAddress: address }
        : role === 'provider'
        ? { providerAddress: address }
        : role === 'arbiter'
        ? { arbiterAddress: address }
        : {
            OR: [
              { clientAddress: address },
              { providerAddress: address },
              { arbiterAddress: address },
            ],
          };

      const [items, total] = await Promise.all([
        prisma.agreement.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: { milestones: { orderBy: { index: 'asc' } } },
        }),
        prisma.agreement.count({ where }),
      ]);
      return { items, total, limit, offset };
    }

    let items = Array.from(this.inMemoryAgreements.values());
    if (role === 'client') {
      items = items.filter((a) => a.clientAddress === address);
    } else if (role === 'provider') {
      items = items.filter((a) => a.providerAddress === address);
    } else if (role === 'arbiter') {
      items = items.filter((a) => a.arbiterAddress === address);
    } else {
      items = items.filter((a) => a.clientAddress === address || a.providerAddress === address || a.arbiterAddress === address);
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return { items: paginated, total, limit, offset };
  }

  public async getAgreements(filters: AgreementQueryFilters = {}) {
    const isDb = await this.isDatabaseAvailable();
    const limit = filters.limit ? Math.min(100, Math.max(1, filters.limit)) : 20;
    const offset = filters.offset || 0;

    if (isDb) {
      const where: any = {};
      if (filters.clientAddress) where.clientAddress = filters.clientAddress;
      if (filters.providerAddress) where.providerAddress = filters.providerAddress;
      if (filters.status) where.status = filters.status;

      const [items, total] = await Promise.all([
        prisma.agreement.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: { milestones: { orderBy: { index: 'asc' } } },
        }),
        prisma.agreement.count({ where }),
      ]);

      return { items, total, limit, offset };
    }

    let items = Array.from(this.inMemoryAgreements.values());
    if (filters.clientAddress) {
      items = items.filter((a) => a.clientAddress === filters.clientAddress);
    }
    if (filters.providerAddress) {
      items = items.filter((a) => a.providerAddress === filters.providerAddress);
    }
    if (filters.status) {
      items = items.filter((a) => a.status === filters.status);
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return { items: paginated, total, limit, offset };
  }

  public async getAgreementByOnChainId(onChainId: bigint) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      return prisma.agreement.findUnique({
        where: { onChainId },
        include: {
          milestones: { orderBy: { index: 'asc' } },
          events: { orderBy: { timestamp: 'desc' }, take: 50 },
        },
      });
    }

    const key = onChainId.toString();
    const agreement = this.inMemoryAgreements.get(key);
    if (!agreement) return null;

    const events = this.inMemoryEvents.filter((e) => e.agreementId === key);
    return {
      ...agreement,
      events,
    };
  }

  public async recordEventLog(event: {
    agreementId?: string;
    type: string;
    ledger: number;
    txHash: string;
    payload: any;
  }) {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      let dbAgreementId: string | undefined = undefined;
      if (event.agreementId) {
        const ag = await prisma.agreement.findUnique({
          where: { onChainId: BigInt(event.agreementId) },
        });
        if (ag) dbAgreementId = ag.id;
      }

      return prisma.indexedEvent.create({
        data: {
          agreementId: dbAgreementId,
          type: event.type,
          ledger: event.ledger,
          txHash: event.txHash,
          payload: event.payload,
        },
      });
    }

    const rec = {
      id: `evt-${Date.now()}-${Math.random()}`,
      agreementId: event.agreementId,
      type: event.type,
      ledger: event.ledger,
      txHash: event.txHash,
      payload: event.payload,
      timestamp: new Date(),
    };
    this.inMemoryEvents.unshift(rec);
    return rec;
  }

  public async getStats(): Promise<PlatformStats> {
    const isDb = await this.isDatabaseAvailable();
    if (isDb) {
      const [totalAgreements, activeEscrows, completedAgreements, disputedAgreements, totalMilestones, agreements] =
        await Promise.all([
          prisma.agreement.count(),
          prisma.agreement.count({ where: { status: AgreementStatus.FUNDED } }),
          prisma.agreement.count({ where: { status: AgreementStatus.COMPLETED } }),
          prisma.agreement.count({ where: { status: AgreementStatus.DISPUTED } }),
          prisma.milestone.count(),
          prisma.agreement.findMany({ select: { totalAmount: true } }),
        ]);

      let totalVol = 0n;
      for (const a of agreements) {
        try {
          totalVol += BigInt(a.totalAmount);
        } catch {
          // ignore parsing error
        }
      }

      return {
        totalAgreements,
        totalVolume: totalVol.toString(),
        activeEscrows,
        completedAgreements,
        disputedAgreements,
        totalMilestones,
      };
    }

    const agreements = Array.from(this.inMemoryAgreements.values());
    let totalVol = 0n;
    let active = 0;
    let completed = 0;
    let disputed = 0;
    let milestonesCount = 0;

    for (const a of agreements) {
      try {
        totalVol += BigInt(a.totalAmount);
      } catch {
        // ignore
      }
      if (a.status === AgreementStatus.FUNDED) active++;
      if (a.status === AgreementStatus.COMPLETED) completed++;
      if (a.status === AgreementStatus.DISPUTED) disputed++;
      milestonesCount += a.milestones?.length || 0;
    }

    return {
      totalAgreements: agreements.length,
      totalVolume: totalVol.toString(),
      activeEscrows: active,
      completedAgreements: completed,
      disputedAgreements: disputed,
      totalMilestones: milestonesCount,
    };
  }

  public clearInMemory() {
    this.inMemoryAgreements.clear();
    this.inMemoryEvents = [];
  }
}

export const agreementRepo = new AgreementRepository();

