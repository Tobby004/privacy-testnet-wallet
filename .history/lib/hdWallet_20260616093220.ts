import { HDNodeWallet, ethers } from "ethers";

export interface DerivedAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  path: string;
}

export class PrivacyWallet {
  private mnemonic: string;
  private masterNode: HDNodeWallet;
  private pathCounter: number = 0;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
    this.masterNode = ethers.Wallet.fromPhrase(mnemonic);
  }

  getDerivedAddress(index?: number): DerivedAddress {
    const idx = index ?? this.pathCounter++;
    const path = `m/44'/60'/0'/0/${idx}`;
    const childNode = this.masterNode.derivePath(path);

    return {
      address: childNode.address,
      privateKey: childNode.privateKey,
      publicKey: childNode.publicKey,
      path,
    };
  }

  getAllDerivedAddresses(count: number): DerivedAddress[] {
    return Array.from({ length: count }, (_, i) =>
      this.getDerivedAddress(i)
    );
  }

  static validateMnemonic(mnemonic: string): boolean {
    try {
      ethers.Wallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }
}

export async function signTransaction(
  wallet: PrivacyWallet,
  tx: ethers.TransactionRequest,
  addressIndex: number
): Promise<string> {
  const { privateKey } = wallet.getDerivedAddress(addressIndex);
  const signer = new ethers.Wallet(privateKey);
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
}