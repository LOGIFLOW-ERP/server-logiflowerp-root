import { ForbiddenException } from '@Config/exception';
import { IUserMongoRepository } from '@Masters/User/Domain';
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC';
import { AdapterEncryption, SHARED_TYPES } from '@Shared/Infrastructure';
import { inject, injectable } from 'inversify';
import { AuthUserDTO, ChangePasswordDTO, State } from 'logiflowerp-sdk';

@injectable()
export class UseCaseChangePassword {

    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
        @inject(SHARED_TYPES.AdapterEncryption) private readonly adapterEncryption: AdapterEncryption,
    ) { }

    async exec(userAuth: AuthUserDTO, data: ChangePasswordDTO) {

        const user = await this.searchUser(userAuth._id)

        const isValid = await this.adapterEncryption.verifyPassword(data.password, user.password)
        if (!isValid) {
            throw new ForbiddenException('Contraseña actual inválida', true)
        }

        if (data.newPassword !== data.confirmNewPassword) {
            throw new ForbiddenException('Nueva contraseña y confirmación no coinciden', true)
        }

        const _isValid = await this.adapterEncryption.verifyPassword(data.newPassword, user.password)
        if (_isValid) {
            throw new ForbiddenException('La nueva contraseña no puede ser igual a la anterior', true)
        }

        const newPasswordHash = await this.adapterEncryption.hashPassword(data.newPassword)

        await this.repository.updateOne(
            { _id: user._id },
            { $set: { password: newPasswordHash } }
        )

    }

    private searchUser(_id: string) {
        const pipeline = [{ $match: { _id, state: State.ACTIVO, isDeleted: false } }]
        return this.repository.selectOne(pipeline)
    }

}