import { CONFIG_TYPES } from '@Config/types'
import { UseCaseUpdateConsumed } from '@Shared/Application'
import { AdapterMail, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { schedule } from 'node-cron'

@injectable()
export class Job {
	private updating_consumption: boolean

	constructor(
		@inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
		@inject(CONFIG_TYPES.Env) private readonly env: Env,
		@inject(SHARED_TYPES.UseCaseUpdateConsumed) private readonly useCaseUpdateConsumed: UseCaseUpdateConsumed,
	) {
		console.log(`Se programó job material consumption`)
		this.updating_consumption = false
		schedule(
			`*/30 * ${env.JOB_MATERIAL_CONSUMPTION_EXEC_START_HOUR}-${env.JOB_MATERIAL_CONSUMPTION_EXEC_END_HOUR} * * *`,
			this._exec.bind(this),
			{ timezone: 'America/Lima' }
		)
	}

	private async _exec() {
		try {
			if (this.updating_consumption) {
				return
			}
			this.updating_consumption = true
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
			this.updating_consumption = false
		}
	}
}