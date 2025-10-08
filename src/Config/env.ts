import { get } from 'env-var'

export const env = {
    PREFIX: get('PREFIX').required().asString(),
    PORT: get('PORT').required().asPortNumber(),
    DOMAINS: get('DOMAINS').required().asArray(),
    NODE_ENV: get('NODE_ENV').required().asEnum(['development', 'qa', 'production']),
    MONGO_URI: get('MONGO_URI').required().asUrlString(),
    RABBITMQ_URL: get('RABBITMQ_URL').required().asUrlString(),
    REDIS_URL: get('REDIS_URL').required().asUrlString(),
    FRONTEND_URL: get('FRONTEND_URL').required().asUrlString(),
    JWT_KEY: get('JWT_KEY').required().asString(),
    EMAIL_USER: get('EMAIL_USER').required().asEmailString(),
    EMAIL_PASS: get('EMAIL_PASS').required().asString(),
    SMTP_HOST: get('SMTP_HOST').required().asString(),
    SMTP_PORT: get('SMTP_PORT').required().asInt(),
    SMTP_SECURE: get('SMTP_SECURE').required().asBoolStrict(),
    JOBS: get('JOBS').required().asBoolStrict(),
    JOB_TOA: get('JOB_TOA').required().asBoolStrict(),
    JOB_WIN: get('JOB_WIN').required().asBoolStrict(),
    DNI_LOOKUP_API_URL: get('DNI_LOOKUP_API_URL').required().asUrlString(),
    DNI_LOOKUP_API_TOKEN: get('DNI_LOOKUP_API_TOKEN').required().asString(),
    ADMINISTRATOR_EMAILS: get('ADMINISTRATOR_EMAILS').required().asArray(),
    TOA_EXECUTION_HOUR: get('TOA_EXECUTION_HOUR').required().asIntPositive(),
    TOA_EXECUTION_MINUTE: get('TOA_EXECUTION_MINUTE').required().asIntPositive(),
    WIN_EXECUTION_HOUR: get('WIN_EXECUTION_HOUR').required().asIntPositive(),
    WIN_EXECUTION_MINUTE: get('WIN_EXECUTION_MINUTE').required().asIntPositive(),
    HOST_API_SCRAPER: get('HOST_API_SCRAPER').required().asUrlString(),
}

export type typeEnv = typeof env