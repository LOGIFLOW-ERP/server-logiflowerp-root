import { ICompanyMongoRepository } from '../Domain';
import {
    collections,
    // CompanyENTITY,
    // CompanyUserDTO,
    CreateRootCompanyDTO,
    RootCompanyENTITY,
    // UserENTITY,
    validateCustom
} from 'logiflowerp-sdk';
import { ConflictException, UnprocessableEntityException } from '@Config/exception';
import { COMPANY_TYPES } from '../Infrastructure/IoC';
import { inject, injectable } from 'inversify';

@injectable()
export class UseCaseInsertOne {

    private transactions: ITransaction<any>[] = []

    constructor(
        @inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
    ) { }

    async exec(dto: CreateRootCompanyDTO) {
        const _entity = new RootCompanyENTITY()
        _entity.set(dto)
        _entity._id = crypto.randomUUID()
        // const user = await this.searchAndValidateUser(dto.identityManager)
        const entityRoot = await validateCustom(_entity, RootCompanyENTITY, UnprocessableEntityException)
        // const entity = await validateCustom(_entity, CompanyENTITY, UnprocessableEntityException)
        // this.createTransactionUpdateUser(user, entityRoot)
        // this.createTransactionCreateCompany(entity)
        this.createTransactionCreateRootCompany(entityRoot)
        await this.repository.executeTransactionBatch(this.transactions)
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