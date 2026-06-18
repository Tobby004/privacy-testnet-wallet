import { ethers } from "ethers";

export interface DerivedAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  path: string;
}

export class PrivacyWallet {
  private mnemonic: string;
  private masterWallet: ethers.Wallet;

  constructor(mnemonic: string) {
    try {
      // Create wallet from mnemonic
      this.masterWallet = ethers.Wallet.fromPhrase(mnemonic);
      this.mnemonic = mnemonic;
    } catch (error) {
      throw new Error("Invalid BIP-39 mnemonic");
    }
  }

  getDerivedAddress(index: number = 0): DerivedAddress {
    const path = `m/44'/60'/0'/0/${index}`;
    
    try {
      // Derive child wallet from the master wallet
      const derivedWallet = this.masterWallet.derivePath(path);
      
      return {
        address: derivedWallet.address,
        privateKey: derivedWallet.privateKey,
        publicKey: derivedWallet.publicKey,
        path,
      };
    } catch (error) {
      console.error("Derivation error:", error);
      throw new Error(`Failed to derive address at path ${path}`);
    }
  }

  getAllDerivedAddresses(count: number): DerivedAddress[] {
    const addresses: DerivedAddress[] = [];
    for (let i = 0; i < count; i++) {
      addresses.push(this.getDerivedAddress(i));
    }
    return addresses;
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
      console.error("Wallet generation error:", error);
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
  if (!signedTx) throw new Error("Failed to sign transaction");
  return signedTx;
}