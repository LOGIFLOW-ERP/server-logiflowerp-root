import { CONFIG_TYPES } from '@Config/types'
import { UseCaseUpdateConsumed } from '@Shared/Application'
import { AdapterMail, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { schedule } from 'node-cron'

@injectable()
export class Job {
	private updating_consumption: boolean
	private readonly jobName = 'JobMaterialConsumption'

	constructor(
		@inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
		@inject(CONFIG_TYPES.Env) private readonly env: Env,
		@inject(SHARED_TYPES.UseCaseUpdateConsumed) private readonly useCaseUpdateConsumed: UseCaseUpdateConsumed,
	) {
		console.log(`[${this.jobName}] 🟢 Programado correctamente`)
		this.updating_consumption = false
		schedule(
			`*/30 * ${env.JOB_MATERIAL_CONSUMPTION_EXEC_START_HOUR}-${env.JOB_MATERIAL_CONSUMPTION_EXEC_END_HOUR} * * *`,
			this._exec.bind(this),
			{ timezone: 'America/Lima' }
		)
	}

	private async _exec() {
		const start = new Date()
		const startTime = start.toLocaleString('es-PE', { timeZone: 'America/Lima' })
		try {
			if (this.updating_consumption) {
				console.warn(`[${this.jobName}] ⚠️ Ya hay una ejecución en curso. Saltando (${startTime})`)
				return
			}
			this.updating_consumption = true
			console.info(`[${this.jobName}] ▶️  Inicio de ejecución a las      ${startTime}`)

			await this.useCaseUpdateConsumed.exec()
			const end = new Date()
			const endTime = end.toLocaleString('es-PE', { timeZone: 'America/Lima' })
			const durationSec = ((end.getTime() - start.getTime()) / 1000).toFixed(2)
			console.info(`[${this.jobName}] ✅ Finalizado correctamente a las ${endTime} (${durationSec}s)`)
		} catch (error) {
			const end = new Date()
			const endTime = end.toLocaleString('es-PE', { timeZone: 'America/Lima' })
			const durationSec = ((end.getTime() - start.getTime()) / 1000).toFixed(2)
			console.error(`[${this.jobName}] ❌ Error durante la ejecución a las ${endTime} (${durationSec}s):`, (error as Error).message)


			console.error(error)
			const plaintextMessage = (error as Error).message
			const subject = `¡Error al iniciar ejecucion Job Win UpdateConsumed!`
			try {
				await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
				console.info(`[${this.jobName}] 📧 Correo de error enviado correctamente`)
			} catch (mailErr) {
				console.error(`[${this.jobName}] 🔴 Error al enviar correo de notificación:`, mailErr)
			}
		} finally {
			this.updating_consumption = false
			console.info(`[${this.jobName}] 💤 Job listo para la siguiente ejecución`)
		}
	}
}