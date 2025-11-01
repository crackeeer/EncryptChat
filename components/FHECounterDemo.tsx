"use client";

import { useState } from "react";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useFHECounter } from "@/hooks/useFHECounter";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { FHECounterAddresses } from "@/abi/FHECounterAddresses";

/*
 * Main FHEMessageBoard React component
 *  - "Send Message" button: allows you to send encrypted messages to other addresses.
 *  - "Decrypt Messages" button: allows you to decrypt received messages.
 *  - "Refresh" button: allows you to refresh the message lists.
 */
export const FHECounterDemo = () => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [messageText, setMessageText] = useState("");
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true, // use enabled to dynamically create the instance on-demand
  });

  //////////////////////////////////////////////////////////////////////////////
  // useFHECounter is a custom hook containing all the FHEMessageBoard logic, including
  // - calling the FHEMessageBoard contract
  // - encrypting FHE inputs for messages
  // - decrypting FHE message handles
  //////////////////////////////////////////////////////////////////////////////

  const fheCounter = useFHECounter({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage, // is global, could be invoked directly in useFHECounter hook
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  //////////////////////////////////////////////////////////////////////////////
  // UI Stuff:
  // --------
  // A basic page containing
  // - A bunch of debug values allowing you to better visualize the React state
  // - 1x "Decrypt" button (to decrypt the latest FHECounter count handle)
  // - 1x "Increment" button (to increment the FHECounter)
  // - 1x "Decrement" button (to decrement the FHECounter)
  //////////////////////////////////////////////////////////////////////////////

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-green-600 active:bg-green-700 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const titleClass = "font-semibold text-green-700 text-lg mt-4";

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-green-600 mb-4">💬 EncryptChat</h1>
            <p className="text-green-500 text-xl">Secure Encrypted Chat Application</p>
          </div>
          <button
            className={buttonClass}
            disabled={isConnected}
            onClick={connect}
          >
            <span className="text-2xl p-4">🦊 Connect MetaMask Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (fheCounter.isDeployed === false) {
    // If on wrong network, show network switch option
    if (chainId && chainId !== 11155111) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-red-200 shadow-lg rounded-xl p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-red-600 mb-4">⚠️ Wrong Network</h1>
              <p className="text-red-500 text-xl mb-4">
                You&apos;re connected to chain ID: {chainId}
              </p>
              <p className="text-gray-700 text-lg">
                This app only works on Sepolia testnet (Chain ID: 11155111)
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-4 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-600 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              onClick={async () => {
                try {
                  await provider?.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
                  });
                } catch (switchError: unknown) {
                  const error = switchError as { code?: number };
                  // If network doesn't exist, add it
                  if (error.code === 4902) {
                    try {
                      await provider?.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                          chainId: '0xaa36a7',
                          chainName: 'Sepolia',
                          nativeCurrency: {
                            name: 'Sepolia ETH',
                            symbol: 'SEP',
                            decimals: 18,
                          },
                          rpcUrls: ['https://sepolia.infura.io/v3/'],
                          blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                        }],
                      });
                    } catch (addError) {
                      console.error('Failed to add Sepolia network:', addError);
                    }
                  } else {
                    console.error('Failed to switch to Sepolia:', switchError);
                  }
                }
              }}
            >
              <span className="text-xl">🔄 Switch to Sepolia Network</span>
            </button>
            <p className="text-gray-500 text-sm mt-4">
              The contract is deployed at: {FHECounterAddresses["11155111"]?.address}
            </p>
          </div>
        </div>
      );
    }
    return errorNotDeployed(chainId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
          <p className="font-bold text-4xl py-6">
            💬 EncryptChat
          </p>
          <p className="text-green-100 pb-4 text-lg">Secure Encrypted Chat Application</p>
        </div>
      <div className="mb-6 px-6 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-lg">
        <p className={titleClass}>📋 Chain Information</p>
        {printProperty("Chain ID", chainId)}
        {printProperty(
          "User Address (Signer)",
          ethersSigner ? ethersSigner.address : "No signer"
        )}
      </div>

      <div className="mb-6 px-6 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-lg">
        <p className={titleClass}>💬 Message Counts</p>
        {printProperty("Sent Messages", fheCounter.sentMessages.length)}
        {printProperty("Received Messages", fheCounter.receivedMessages.length)}
        {printProperty("Total Messages", fheCounter.sentMessages.length + fheCounter.receivedMessages.length)}
      </div>
      <div className="mb-6 px-6 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-lg">
        <p className={titleClass}>📝 Send Message</p>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="px-4 py-3 border border-green-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Message Content (max 8 chars)"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value.slice(0, 8))}
            className="px-4 py-3 border border-green-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all duration-200"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          className={buttonClass}
          disabled={!fheCounter.canSendMessage || !recipientAddress || !messageText}
          onClick={() => fheCounter.sendMessage(recipientAddress, messageText)}
        >
          {fheCounter.canSendMessage && recipientAddress && messageText
            ? "Send Message 📤"
            : fheCounter.isSending
              ? "Sending..."
              : "Enter Address and Message"}
        </button>
        <button
          className={buttonClass}
          disabled={!fheCounter.canGetMessages}
          onClick={fheCounter.refreshMessages}
        >
          {fheCounter.canGetMessages
            ? "Refresh Messages"
            : "FHE Message Board not available"}
        </button>
      </div>
      <div className="mb-6 px-6 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-lg">
        <p className={titleClass}>🔓 Decrypt Received Messages</p>
        {fheCounter.receivedMessages.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 mt-2">
            {fheCounter.receivedMessages.map((messageId) => (
              <div key={messageId} className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-green-600">Message #{messageId}</span>
                  {fheCounter.messageContents[messageId] ? (
                    <span className="text-xs text-green-500">✅ Decrypted</span>
                  ) : (
                    <span className="text-xs text-gray-500">🔒 Encrypted</span>
                  )}
                </div>
                {fheCounter.messageContents[messageId] ? (
                  <div className="bg-white border border-green-300 rounded-lg p-3 mt-2">
                    <span className="font-mono text-green-700 font-semibold text-lg">
                      💬 {fheCounter.messageContents[messageId].clear}
                    </span>
                  </div>
                ) : (
                  <button
                    className={`${buttonClass} py-2 px-4 text-sm mt-2`}
                    disabled={!fheCounter.canDecrypt || fheCounter.isDecrypting}
                    onClick={() => fheCounter.decryptMessage(messageId)}
                  >
                    {fheCounter.isDecrypting ? "Decrypting..." : "🔓 Decrypt Message"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-2 text-center py-4">📭 No received messages</p>
        )}
      </div>
      <div className="mb-6">
      </div>

      </div>
    </div>
  );
};

function printProperty(name: string, value: unknown) {
  let displayValue: string;

  if (typeof value === "boolean") {
    return printBooleanProperty(name, value);
  } else if (typeof value === "string" || typeof value === "number") {
    displayValue = String(value);
  } else if (typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
  } else if (value === undefined) {
    displayValue = "undefined";
  } else if (value instanceof Error) {
    displayValue = value.message;
  } else {
    displayValue = JSON.stringify(value);
  }
  return (
    <p className="text-black">
      {name}:{" "}
      <span className="font-mono font-semibold text-black">{displayValue}</span>
    </p>
  );
}

function printBooleanProperty(name: string, value: boolean) {
  if (value) {
    return (
      <p className="text-black">
        {name}:{" "}
        <span className="font-mono font-semibold text-green-500">true</span>
      </p>
    );
  }

  return (
    <p className="text-black">
      {name}:{" "}
      <span className="font-mono font-semibold text-red-500">false</span>
    </p>
  );
}
