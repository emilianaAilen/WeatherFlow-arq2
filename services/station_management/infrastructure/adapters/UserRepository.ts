import { User, SubscriptionsList } from '@/domain';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { UserModel, IUserDocument } from '@/infrastructure/database/schemas/UserSchema';

export class UserRepository implements IUserRepository {
  private toDomain(doc: IUserDocument): User {
    return new User(
      doc._id as string,
      doc.name,
      doc.surname,
      doc.email,
      SubscriptionsList.create(doc.subscriptions.map(String)),
    );
  }

  async save(user: User): Promise<void> {
    await UserModel.create({
      _id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      subscriptions: user.subscriptions.stationIds,
    });
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, user: User): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      name: user.name,
      surname: user.surname,
      email: user.email,
      subscriptions: user.subscriptions.stationIds,
    }).exec();
  }

  async remove(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id).exec();
  }

  async getAll(): Promise<User[]> {
    const docs = await UserModel.find().exec();
    return docs.map(this.toDomain.bind(this));
  }
}
