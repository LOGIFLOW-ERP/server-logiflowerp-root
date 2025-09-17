import { env } from '@Config/env'
import { schedule } from 'node-cron'

export class Job {
	constructor() {
		schedule(`${env.TOA_EXECUTION_MINUTE ?? '0'} ${env.TOA_EXECUTION_HOUR ?? '0'} * * *`, this._exec.bind(this))
	}

	private async _exec() {
		console.log('Ok');
	}
}