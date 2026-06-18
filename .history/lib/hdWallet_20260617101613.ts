import { HDNodeWallet, ethers, Mnemonic } from "ethers";

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
    // Validate and create wallet from mnemonic
    try {
      // Create wallet directly from mnemonic phrase
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      this.mnemonic = mnemonic;
      this.masterNode = wallet as HDNodeWallet;
    } catch (error) {
      throw new Error("Invalid BIP-39 mnemonic");
    }
  }

  getDerivedAddress(index?: number): DerivedAddress {
    const idx = index ?? this.pathCounter++;
    const path = `m/44'/60'/0'/0/${idx}`;
    
    try {
      const childNode = this.masterNode.derivePath(path) as HDNodeWallet;
      return {
        address: childNode.address,
        privateKey: childNode.privateKey,
        publicKey: childNode.publicKey,
        path,
      };
    } catch (error) {
      throw new Error(`Failed to derive address at path ${path}`);
    }
  }

  getAllDerivedAddresses(count: number): DerivedAddress[] {
    return Array.from({ length: count }, (_, i) => this.getDerivedAddress(i));
  }

  static validateMnemonic(mnemonic: string): boolean {
    try {
      ethers.Wallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  // Generate a random new testnet wallet
  static generateTestnetWallet(): { mnemonic: string; wallet: PrivacyWallet } {
    try {
      // Generate random wallet
      const randomWallet = ethers.Wallet.createRandom();
      
      // Get the mnemonic phrase
      const mnemonicPhrase = randomWallet.mnemonic?.phrase;
      if (!mnemonicPhrase) {
        throw new Error("Failed to generate mnemonic phrase");
      }
      
      // Create PrivacyWallet from the mnemonic
      const wallet = new PrivacyWallet(mnemonicPhrase);
      
      return {
        mnemonic: mnemonicPhrase,
        wallet,
      };
    } catch (error) {
      throw new Error("Failed to generate testnet wallet");
    }
  }

  getMnemonic(): string {
    return this.mnemonic;
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