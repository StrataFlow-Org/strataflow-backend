import {
  Keypair,
  WebAuth,
  StrKey,
} from '@stellar/stellar-sdk';
import crypto from 'node:crypto';
import { config } from '../config.js';

export interface TokenClaims {
  sub: string;
  iat: number;
  exp: number;
  iss: string;
}

export class Sep10AuthService {
  private serverKeypair: Keypair;
  private usedChallenges: Map<string, number> = new Map();

  constructor() {
    if (config.SERVER_SIGNING_KEY && config.SERVER_SIGNING_KEY.startsWith('S')) {
      this.serverKeypair = Keypair.fromSecret(config.SERVER_SIGNING_KEY);
    } else {
      this.serverKeypair = Keypair.random();
    }
  }

  public getServerPublicKey(): string {
    return this.serverKeypair.publicKey();
  }

  public getServerSecret(): string {
    return this.serverKeypair.secret();
  }

  /**
   * Generates a cryptographic SEP-10 challenge transaction
   */
  public generateChallenge(
    clientPublicKey: string,
    homeDomain: string = 'strataflow.io'
  ): { challengeXdr: string; networkPassphrase: string } {
    if (!StrKey.isValidEd25519PublicKey(clientPublicKey)) {
      throw new Error('Invalid Stellar client public key');
    }

    const challengeTx = WebAuth.buildChallengeTx(
      this.serverKeypair,
      clientPublicKey,
      homeDomain,
      config.CHALLENGE_EXPIRES_IN_SECONDS,
      config.STELLAR_NETWORK_PASSPHRASE,
      homeDomain
    );

    return {
      challengeXdr: challengeTx,
      networkPassphrase: config.STELLAR_NETWORK_PASSPHRASE,
    };
  }

  /**
   * Cryptographically verifies the client signature on the SEP-10 challenge
   */
  public verifyChallenge(
    clientPublicKey: string,
    signedXdr: string,
    homeDomain: string = 'strataflow.io'
  ): boolean {
    if (!StrKey.isValidEd25519PublicKey(clientPublicKey) || !signedXdr) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    // Periodically evict expired entries to prevent memory exhaustion without resetting active replay protection
    for (const [chHash, expTime] of this.usedChallenges.entries()) {
      if (expTime < now) {
        this.usedChallenges.delete(chHash);
      }
    }

    const hash = crypto.createHash('sha256').update(signedXdr).digest('hex');
    if (this.usedChallenges.has(hash)) {
      return false;
    }

    try {
      const signers = WebAuth.verifyChallengeTxSigners(
        signedXdr,
        this.serverKeypair.publicKey(),
        config.STELLAR_NETWORK_PASSPHRASE,
        [clientPublicKey],
        [homeDomain],
        homeDomain
      );

      const hasClientSignature = signers.includes(clientPublicKey);
      if (hasClientSignature) {
        this.usedChallenges.set(hash, now + config.CHALLENGE_EXPIRES_IN_SECONDS);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generates a tamper-proof HMAC-SHA256 authenticated JWT
   */
  public generateToken(clientPublicKey: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        sub: clientPublicKey,
        iat: now,
        exp: now + 86400,
        iss: 'strataflow-protocol',
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', config.JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validates and decodes JWT token
   */
  public verifyToken(token: string): TokenClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      const sigBuf = Buffer.from(signature, 'base64url');
      const expectedBuf = Buffer.from(expectedSignature, 'base64url');
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const claims: TokenClaims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp < now || (claims.iat && claims.iat > now + 60)) return null;
      if (claims.iss !== 'strataflow-protocol') return null;
      if (!claims.sub || !StrKey.isValidEd25519PublicKey(claims.sub)) return null;

      return claims;
    } catch {
      return null;
    }
  }
}

export const sep10Service = new Sep10AuthService();
