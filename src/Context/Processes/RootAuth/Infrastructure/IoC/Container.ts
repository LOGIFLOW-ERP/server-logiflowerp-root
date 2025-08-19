import { ContainerModule } from 'inversify';
import { AUTH_TYPES } from './types';
import {
    UseCaseChangePassword,
    UseCaseGetToken,
    UseCaseRequestPasswordReset,
    UseCaseResetPassword,
    UseCaseSignIn,
    UseCaseSignUp
} from '../../Application';

export const containerModule = new ContainerModule(bind => {
    bind(AUTH_TYPES.UseCaseSignUp).to(UseCaseSignUp)
    bind(AUTH_TYPES.UseCaseRequestPasswordReset).to(UseCaseRequestPasswordReset)
    bind(AUTH_TYPES.UseCaseResetPassword).to(UseCaseResetPassword)
    bind(AUTH_TYPES.UseCaseSignIn).to(UseCaseSignIn)
    bind(AUTH_TYPES.UseCaseGetToken).to(UseCaseGetToken)
    bind(AUTH_TYPES.UseCaseChangePassword).to(UseCaseChangePassword)
})