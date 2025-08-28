import { ForbiddenException } from '@Config/exception';
import { IUserMongoRepository } from '@Masters/User/Domain';
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC';
import { AdapterEncryption, AdapterToken, SHARED_TYPES } from '@Shared/Infrastructure';
import { inject, injectable } from 'inversify';

@injectable()
export class UseCaseResetPassword {

    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
        @inject(SHARED_TYPES.AdapterToken) private readonly adapterToken: AdapterToken,
        @inject(SHARED_TYPES.AdapterEncryption) private readonly adapterEncryption: AdapterEncryption,
    ) { }

    async exec(token: string, newPassword: string) {

        const payload = await this.adapterToken.verify(token)
        if (!payload) {
            throw new ForbiddenException('Token inválido o expirado', true)
        }

        const password = await this.adapterEncryption.hashPassword(newPassword)

        await this.repository.updateOne(
            { _id: payload.user._id },
            { $set: { password } }
        )

    }

}