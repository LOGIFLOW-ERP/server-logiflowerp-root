import { CONFIG_TYPES } from '@Config/types'
import { AdapterMail, MongoRepository, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { schedule } from 'node-cron'
import { UseCaseUpdateConsumed } from '../Processes/ToaOrder/Application'
import { WIN_ORDER_TYPES } from '../Processes/WinOrder/Infrastructure/IoC/types'
import {
	AuthUserDTO,
	collections,
	db_root,
	ScrapingCredentialENTITY,
	ScrapingSystem
} from 'logiflowerp-sdk'

@injectable()
export class Job {
	constructor(
		@inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
		@inject(CONFIG_TYPES.Env) private readonly env: Env,
		@inject(WIN_ORDER_TYPES.UseCaseUpdateConsumed) private readonly useCaseUpdateConsumed: UseCaseUpdateConsumed,
	) {
		if (!env.JOB_WIN) {
			return
		}
		console.log(`Se programó job WIN`)
		schedule(
			`*/30 * ${env.WIN_EXECUTION_START_HOUR}-${env.WIN_EXECUTION_END_HOUR} * * *`,
			this._exec.bind(this),
			{ timezone: 'America/Lima' }
		)
	}

	private async _exec() {
		const repositoryMongoScrapingCredential = new MongoRepository<ScrapingCredentialENTITY>(db_root, collections.scrapingCredential, new AuthUserDTO())
		const filter = { system: ScrapingSystem.WIN, isDeleted: false }
		try {
			const pipeline = [{ $match: filter }]
			const scrapingCredential = await repositoryMongoScrapingCredential.selectOne(pipeline)

			if (scrapingCredential.updating_consumption) {
				return
			}

			await repositoryMongoScrapingCredential.updateOne(filter, { $set: { updating_consumption: true } })

			await this.useCaseUpdateConsumed.exec()
		} catch (error) {
			console.error(error)
			const plaintextMessage = (error as Error).message
			const subject = `¡Error al iniciar ejecucion Job Win UpdateConsumed!`
			try {
				await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
			} catch (error) {
				console.error('🔴🔴🔴 ERROR LA ENVIAR CORREO WIN 🔴🔴🔴', error)
			}
		} finally {
			await repositoryMongoScrapingCredential.updateOne(filter, { $set: { updating_consumption: false } })
		}
	}
}