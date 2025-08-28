import { injectable } from 'inversify'
import crypto from "crypto";

@injectable()
export class AdapterEncryption {
    async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString('hex')
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err)
                resolve(`${salt}:${derivedKey.toString('hex')}`)
            })
        })
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const [salt, key] = hash.split(':')
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err)
                resolve(key === derivedKey.toString('hex'))
            })
        })
    }
}