import { ContainerModule } from 'inversify';
import { CONFIG_TYPES } from './types';
import { env } from './env';

export const containerModule = new ContainerModule(bind => {
    bind(CONFIG_TYPES.Env).toConstantValue(env)
})