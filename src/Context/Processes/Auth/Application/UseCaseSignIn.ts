import { ConflictException, ForbiddenException } from '@Config/exception'
import { SignInDTO, State, UserENTITY } from 'logiflowerp-sdk'
import { IUserMongoRepository } from '@Masters/User/Domain'
import { CONFIG_TYPES } from '@Config/types'
import { inject, injectable } from 'inversify'
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC'
import { AdapterEncryption, SHARED_TYPES } from '@Shared/Infrastructure'

@injectable()
export class UseCaseSignIn {

    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
        @inject(SHARED_TYPES.AdapterEncryption) private readonly adapterEncryption: AdapterEncryption,
    ) { }

    async exec(dto: SignInDTO) {
        if (!this.env.ADMINISTRATOR_EMAILS.includes(dto.email)) {
            throw new ForbiddenException('Acceso denegado: este usuario no está autorizado como administrador', true)
        }
        const user = await this.searchUser(dto.email)
        if (!user.state) {
            throw new ForbiddenException('El usuario está inactivo', true)
        }
        if (!user.emailVerified) {
            throw new ForbiddenException('Correo no verificado', true)
        }
        await this.verifyPassword(dto, user)
        return { user }
    }

    private async verifyPassword(dto: SignInDTO, user: UserENTITY) {
        const isValid = await this.adapterEncryption.verifyPassword(dto.password, user.password)
        if (!isValid) {
            throw new ForbiddenException('Credenciales inválidas', true)
        }
    }

    private async searchUser(email: string) {
        const pipeline = [{ $match: { email, state: State.ACTIVO, isDeleted: false } }]
        const result = await this.repository.select(pipeline)
        if (!result.length) {
            throw new ForbiddenException('Credenciales inválidas', true)
        }
        if (result.length > 1) {
            throw new ConflictException(`Se encontraron múltiples usuarios con email ${email}.`)
        }
        return result[0]
    }
}