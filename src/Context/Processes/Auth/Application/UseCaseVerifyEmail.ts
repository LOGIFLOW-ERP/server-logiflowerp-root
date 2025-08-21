import { DataVerifyEmailDTO } from '../Domain';
import { AdapterToken, MongoRepository, SHARED_TYPES } from '@Shared/Infrastructure';
import { BadRequestException, ForbiddenException } from '@Config/exception';
import { inject } from 'inversify';
import { AuthUserDTO, collections, State, UserENTITY } from 'logiflowerp-sdk';
import { IUserMongoRepository } from '@Masters/User/Domain';
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC';

export class UseCaseVerifyEmail {

    constructor(
        @inject(SHARED_TYPES.AdapterToken) private readonly adapterToken: AdapterToken,
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
    ) { }

    async exec(data: DataVerifyEmailDTO) {

        const payload = await this.adapterToken.verify(data.token)
        if (!payload) {
            throw new ForbiddenException('Token no válido o expirado')
        }

        const pipeline = [{ $match: { _id: payload.user._id, state: State.ACTIVO, isDeleted: false } }]
        const user = await this.repository.selectOne(pipeline)

        if (user.emailVerified) {
            throw new BadRequestException('Email ya se verificó')
        }

        const filter = { _id: user._id }
        const update = { $set: { emailVerified: true } }
        await this.repository.updateOne(filter, update)
    }

}