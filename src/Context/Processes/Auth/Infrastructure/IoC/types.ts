export const AUTH_TYPES = {
    UseCaseSignUp: Symbol.for(`${__dirname}UseCaseSignUp`),
    UseCaseRequestPasswordReset: Symbol.for(`${__dirname}UseCaseRequestPasswordReset`),
    UseCaseResetPassword: Symbol.for(`${__dirname}UseCaseResetPassword`),
    UseCaseGetToken: Symbol.for(`${__dirname}UseCaseGetToken`),
    UseCaseSignIn: Symbol.for(`${__dirname}UseCaseSignIn`),
    UseCaseChangePassword: Symbol.for(`${__dirname}UseCaseChangePassword`),
    UseCaseGetSystemOptionRoot: Symbol.for(`${__dirname}UseCaseGetSystemOptionRoot`),
}