import { ContainerModule } from 'inversify';
import { AUTH_TYPES } from './types';
import {
    UseCaseChangePassword,
    UseCaseGetSystemOptionRoot,
    UseCaseGetToken,
    UseCaseRequestPasswordReset,
    UseCaseResendMailRegisterUser,
    UseCaseResetPassword,
    UseCaseSignIn,
    UseCaseSignUp,
    UseCaseVerifyEmail
} from '../../Application';

export const containerModule = new ContainerModule(bind => {
    bind(AUTH_TYPES.UseCaseSignUp).to(UseCaseSignUp)
    bind(AUTH_TYPES.UseCaseRequestPasswordReset).to(UseCaseRequestPasswordReset)
    bind(AUTH_TYPES.UseCaseResetPassword).to(UseCaseResetPassword)
    bind(AUTH_TYPES.UseCaseSignIn).to(UseCaseSignIn)
    bind(AUTH_TYPES.UseCaseGetToken).to(UseCaseGetToken)
    bind(AUTH_TYPES.UseCaseChangePassword).to(UseCaseChangePassword)
    bind(AUTH_TYPES.UseCaseGetSystemOptionRoot).to(UseCaseGetSystemOptionRoot)
    bind(AUTH_TYPES.UseCaseVerifyEmail).to(UseCaseVerifyEmail)
    bind(AUTH_TYPES.UseCaseResendMailRegisterUser).to(UseCaseResendMailRegisterUser)
})