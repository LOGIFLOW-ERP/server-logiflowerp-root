import { ConflictException } from '@Config/exception';
import { inject, injectable } from 'inversify';
import { DataRequestResendMailRegisterUser } from '../Domain';
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC';
import { IUserMongoRepository } from '@Masters/User/Domain';

@injectable()
export class UseCaseResendMailRegisterUser {
    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
    ) { }

    async exec(data: DataRequestResendMailRegisterUser) {
        const user = await this.repository.selectOne([{ $match: { email: data.email, isDeleted: false } }])
        if (user.emailVerified) {
            throw new ConflictException('El correo ya ha sido verificado')
        }
        return user
    }
}