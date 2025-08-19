import { ForbiddenException } from '@Config/exception';
import { IUserMongoRepository } from '@Masters/User/Domain';
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC';
import { inject, injectable } from 'inversify';
import { AuthUserDTO, ChangePasswordDTO, State } from 'logiflowerp-sdk';

@injectable()
export class UseCaseChangePassword {

    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
    ) { }

    async exec(userAuth: AuthUserDTO, data: ChangePasswordDTO) {

        const user = await this.searchUser(userAuth._id)

        if (user.password !== data.password) {
            throw new ForbiddenException('Contraseña actual inválida', true)
        }

        if (data.newPassword !== data.confirmNewPassword) {
            throw new ForbiddenException('Nueva contraseña y confirmación no coinciden', true)
        }

        if (user.password === data.newPassword) {
            throw new ForbiddenException('La nueva contraseña no puede ser igual a la anterior', true)
        }

        await this.repository.updateOne(
            { _id: user._id },
            { $set: { password: data.newPassword } }
        )

    }

    private searchUser(_id: string) {
        const pipeline = [{ $match: { _id, state: State.ACTIVO, isDeleted: false } }]
        return this.repository.selectOne(pipeline)
    }

}