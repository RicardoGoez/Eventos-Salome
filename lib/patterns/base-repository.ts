import { IRepository } from "./repository.interface";

// Implementación base del patrón Repository
// En producción, esto se conectaría a una base de datos real
export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected storage: Map<string, T> = new Map();

  async findById(id: string): Promise<T | null> {
    return this.storage.get(id) || null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.storage.values());
  }

  async create(entity: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    const newEntity = {
      ...entity,
      id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    this.storage.set(id, newEntity);
    return newEntity;
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }
    const updated = {
      ...existing,
      ...entity,
      id,
      updatedAt: new Date(),
    } as T;
    this.storage.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
