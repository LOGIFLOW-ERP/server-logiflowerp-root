import { CONFIG_TYPES } from '@Config/types'
import { AdapterMail, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { schedule } from 'node-cron'

@injectable()
export class Job {
	constructor(
		@inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
		@inject(CONFIG_TYPES.Env) private readonly env: Env,
	) {
		schedule(`${env.TOA_EXECUTION_MINUTE ?? '0'} ${env.TOA_EXECUTION_HOUR ?? '0'} * * *`, this._exec.bind(this))
	}

	private async _exec() {
		try {
			//#region WebHook
			const url = `${this.env.HOST_API_SCRAPER}toa`
			const response = await fetch(url, { method: 'POST' })
			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Error ${response.status}: ${errorText}`)
			}
			//#endregion WebHook
		} catch (error) {
			console.error(error)
			const plaintextMessage = (error as Error).message
			const subject = `¡Error al iniciar ejecucion Job UpdateConsumed!`
			try {
				await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
			} catch (error) {
				console.error('🔴🔴🔴 ERROR LA ENVIAR CORREO 🔴🔴🔴', error)
			}
		}
	}
}