import { ForbiddenException, UnprocessableEntityException } from '@Config/exception'
import { CONFIG_TYPES } from '@Config/types'
import { IRENIECPersonalData, IUserMongoRepository } from '@Masters/User/Domain'
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC'
import { AdapterApiRequest, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { CreateUserDTO, DocumentType, UserENTITY, validateCustom } from 'logiflowerp-sdk'

@injectable()
export class UseCaseSignUp {

	constructor(
		@inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
		@inject(SHARED_TYPES.AdapterApiRequest) private readonly adapterApiRequest: AdapterApiRequest,
		@inject(CONFIG_TYPES.Env) private readonly env: Env,
	) { }

	async exec(dto: CreateUserDTO) {
		if (!this.env.ADMINISTRATOR_EMAILS.includes(dto.email)) {
			throw new ForbiddenException('Acceso denegado: este usuario no está autorizado como administrador', true)
		}
		const RENIECPersonalData = await this.RENIECPersonalDataConsultation(dto)
		const entity = this.completeUserData(dto, RENIECPersonalData)
		const validatedEntity = await validateCustom(entity, UserENTITY, UnprocessableEntityException)
		return this.repository.insertOne(validatedEntity)
	}

	private async RENIECPersonalDataConsultation(dto: CreateUserDTO) {
		if (dto.documentType !== DocumentType.DNI) return
		const url = `${this.env.DNI_LOOKUP_API_URL}/v2/reniec/dni?numero=${dto.identity}`
		const headers = { Authorization: `Bearer ${this.env.DNI_LOOKUP_API_TOKEN}` }
		const result = await this.adapterApiRequest.get<IRENIECPersonalData>(url, { headers })
		return validateCustom(result, IRENIECPersonalData, UnprocessableEntityException)
	}

	private completeUserData(dto: CreateUserDTO, RENIECPersonalData: IRENIECPersonalData | undefined) {
		const newUser = new UserENTITY()
		newUser._id = crypto.randomUUID()
		newUser.set(dto)
		if (RENIECPersonalData) {
			newUser.names = RENIECPersonalData.nombres
			newUser.surnames = `${RENIECPersonalData.apellidoPaterno} ${RENIECPersonalData.apellidoMaterno}`
		}
		newUser.emailVerified = true
		return newUser
	}

}