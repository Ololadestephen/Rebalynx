import { hash } from "starknet";

export class SignatureService {
  verifySignature(wallet: string, signature: string[], message: string): boolean {
    if (!wallet || signature.length < 2 || !message) {
      return false;
    }

    try {
      const msgHash = hash.computeHashOnElements([BigInt(hash.starknetKeccak(message)), BigInt(wallet)]);
      return Boolean(msgHash) && signature.every((s) => s.startsWith("0x"));
    } catch {
      return false;
    }
  }
}
