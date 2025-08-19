import { ICompanyMongoRepository } from '../Domain'
import {
    collections,
    CompanyENTITY,
    CompanyUserDTO,
    RootCompanyENTITY,
    UpdateCompanyDTO,
    UpdateRootCompanyDTO,
    UserENTITY,
    validateCustom
} from 'logiflowerp-sdk'
import { ConflictException, UnprocessableEntityException } from '@Config/exception'
import { inject, injectable } from 'inversify'
import { COMPANY_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseUpdateOne {

    private transactions: ITransaction<any>[] = []

    constructor(
        @inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
    ) { }

    async exec(_id: string, dto: UpdateRootCompanyDTO) {
        const { changedManager, rootCompany } = await this.changedManager(_id, dto)
        if (changedManager) {
            const user = await this.searchAndValidateUser(dto.identityManager)
            this.createTransactionUpdateUser(user, rootCompany)
        }
        this.createTransactionUpdateRootCompany(_id, dto)
        await this.createTransactionUpdateCompany(dto, rootCompany)
        await this.repository.executeTransactionBatch(this.transactions)
    }

    private async changedManager(_id: string, dto: UpdateRootCompanyDTO) {
        const pipeline = [{ $match: { _id, isDeleted: false } }]
        const data = await this.repository.selectOne(pipeline)
        return { changedManager: data.identityManager !== dto.identityManager, rootCompany: data }
    }

    private async searchAndValidateUser(identity: string) { // MISMA VALIDACION SE DEBE HACER EN CREAR
        const pipeline = [{ $match: { identity, isDeleted: false } }]
        const data = await this.repository.selectOne<UserENTITY>(pipeline, collections.user)
        if (data.root) {
            throw new ConflictException(`El usuario con identificación ${identity}, ya es root`)
        }
        return data
    }

    private createTransactionUpdateRootCompany(_id: string, dto: UpdateRootCompanyDTO) {
        const transaction: ITransaction<RootCompanyENTITY> = {
            transaction: 'updateOne',
            filter: { _id },
            update: { $set: dto }
        }
        this.transactions.push(transaction)
    }

    private async createTransactionUpdateCompany(dto: UpdateRootCompanyDTO, rootCompany: RootCompanyENTITY) {
        const transaction: ITransaction<CompanyENTITY> = {
            database: rootCompany.code,
            transaction: 'updateOne',
            filter: { code: rootCompany.code },
            update: { $set: await validateCustom(dto, UpdateCompanyDTO, UnprocessableEntityException) }
        }
        this.transactions.push(transaction)
    }

    private createTransactionUpdateUser(user: UserENTITY, entity: RootCompanyENTITY) {
        const company = new CompanyUserDTO()
        company.set(entity)
        const transaction: ITransaction<UserENTITY> = {
            collection: collections.user,
            transaction: 'updateOne',
            filter: { _id: user._id },
            update: {
                $set: {
                    root: true,
                    company
                }
            }
        }
        this.transactions.push(transaction)
    }

}