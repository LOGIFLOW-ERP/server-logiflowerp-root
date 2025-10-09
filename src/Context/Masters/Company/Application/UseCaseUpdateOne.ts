import { ICompanyMongoRepository } from '../Domain'
import {
    collections,
    ProfileENTITY,
    RootCompanyENTITY,
    UpdateRootCompanyDTO,
} from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { COMPANY_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseUpdateOne {

    private transactions: ITransaction<any>[] = []

    constructor(
        @inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
    ) { }

    async exec(_id: string, dto: UpdateRootCompanyDTO) {
        const company = await this.repository.selectOne([{ $match: { _id } }])
        await this.verififyPermisions(company, dto)
        this.createTransactionUpdateRootCompany(_id, dto)
        await this.repository.executeTransactionBatch(this.transactions)
    }

    private async verififyPermisions(company: RootCompanyENTITY, dto: UpdateRootCompanyDTO) {
        const areDifferent = company.systemOptions.sort().join() !== dto.systemOptions.sort().join()
        if (!areDifferent) return
        const profiles = await this.repository.select<ProfileENTITY>(
            [{ $match: {} }],
            collections.profile,
            company.code
        )
        for (const profile of profiles) {
            const newSystemOptions = profile.systemOptions.filter(option =>
                dto.systemOptions.includes(option)
            )
            if (newSystemOptions.length !== profile.systemOptions.length) {
                const transaction: ITransaction<RootCompanyENTITY> = {
                    database: company.code,
                    collection: collections.profile,
                    transaction: 'updateOne',
                    filter: { _id: profile._id },
                    update: { $set: { systemOptions: newSystemOptions } }
                }
                this.transactions.push(transaction)
            }
        }
    }

    private createTransactionUpdateRootCompany(_id: string, dto: UpdateRootCompanyDTO) {
        const transaction: ITransaction<RootCompanyENTITY> = {
            transaction: 'updateOne',
            filter: { _id },
            update: { $set: dto }
        }
        this.transactions.push(transaction)
    }
}