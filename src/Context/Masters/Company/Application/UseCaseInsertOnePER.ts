import { ICompanyMongoRepository } from '../Domain';
import {
    collections,
    // CompanyENTITY,
    // CompanyUserDTO,
    CreateRootCompanyPERDTO,
    RootCompanyENTITY,
    SUNATCompanyDataDTO,
    // UserENTITY,
    validateCustom
} from 'logiflowerp-sdk';
import { ConflictException, UnprocessableEntityException } from '@Config/exception';
import { AdapterApiRequest, SHARED_TYPES } from '@Shared/Infrastructure';
import { inject, injectable } from 'inversify';
import { CONFIG_TYPES } from '@Config/types';
import { COMPANY_TYPES } from '../Infrastructure/IoC';

@injectable()
export class UseCaseInsertOnePER {

    private transactions: ITransaction<any>[] = []

    constructor(
        @inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
        @inject(SHARED_TYPES.AdapterApiRequest) private readonly adapterApiRequest: AdapterApiRequest,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async exec(dto: CreateRootCompanyPERDTO) {
        const _entity = new RootCompanyENTITY()
        _entity.set(dto)
        _entity._id = crypto.randomUUID()
        // const user = await this.searchAndValidateUser(dto.identityManager)
        const SUNATCompanyData = await this.SUNATCompanyDataConsultation(dto.ruc)
        this.completeDataPER(_entity, SUNATCompanyData)
        const entityRoot = await validateCustom(_entity, RootCompanyENTITY, UnprocessableEntityException)
        // const entity = await validateCustom(_entity, CompanyENTITY, UnprocessableEntityException)
        // this.createTransactionUpdateUser(user, entityRoot)
        // this.createTransactionCreateCompany(entity)
        this.createTransactionCreateRootCompany(entityRoot)
        await this.repository.executeTransactionBatch(this.transactions)
        return entityRoot
    }

    private async SUNATCompanyDataConsultation(ruc: string) {
        const url = `${this.env.DNI_LOOKUP_API_URL}/v2/sunat/ruc/full?numero=${ruc}`
        const headers = { Authorization: `Bearer ${this.env.DNI_LOOKUP_API_TOKEN}` }
        const result = await this.adapterApiRequest.get<SUNATCompanyDataDTO>(url, { headers })       
        return validateCustom(result, SUNATCompanyDataDTO, UnprocessableEntityException)
    }

    private completeDataPER(entity: RootCompanyENTITY, SUNATCompanyData: SUNATCompanyDataDTO) {
        entity.address = SUNATCompanyData.direccion
        entity.companyname = SUNATCompanyData.razonSocial
        entity.sector = SUNATCompanyData.actividadEconomica
    }

    // private async searchAndValidateUser(identity: string) { // MISMA VALIDACION SE DEBE HACER EN EDITAR
    //     const pipeline = [{ $match: { identity, isDeleted: false } }]
    //     const data = await this.repository.selectOne<UserENTITY>(pipeline, collections.user)
    //     if (data.root) {
    //         throw new ConflictException(`El usuario con identificación ${identity}, ya es root`)
    //     }
    //     return data
    // }

    private createTransactionCreateRootCompany(entity: RootCompanyENTITY) {
        const transaction: ITransaction<RootCompanyENTITY> = {
            collection: collections.company,
            transaction: 'insertOne',
            doc: entity
        }
        this.transactions.push(transaction)
    }

    // private createTransactionCreateCompany(entity: CompanyENTITY) {
    //     const transaction: ITransaction<CompanyENTITY> = {
    //         database: entity.code,
    //         collection: collections.company,
    //         transaction: 'insertOne',
    //         doc: entity
    //     }
    //     this.transactions.push(transaction)
    // }

    // private createTransactionUpdateUser(user: UserENTITY, entity: RootCompanyENTITY) {
    //     const company = new CompanyUserDTO()
    //     company.set(entity)
    //     const transaction: ITransaction<UserENTITY> = {
    //         collection: collections.user,
    //         transaction: 'updateOne',
    //         filter: { _id: user._id },
    //         update: {
    //             $set: {
    //                 root: true,
    //                 company
    //             }
    //         }
    //     }
    //     this.transactions.push(transaction)
    // }

}