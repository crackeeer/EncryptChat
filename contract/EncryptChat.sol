// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title An encrypted message board using FHE
/// @notice Users can send encrypted messages that only the recipient can decrypt
contract FHEMessageBoard is SepoliaConfig {
    
    struct EncryptedMessage {
        euint64 encryptedContent;
        address sender;
        address recipient;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(uint256 => EncryptedMessage) private messages;
    mapping(address => uint256[]) private sentMessages;
    mapping(address => uint256[]) private receivedMessages;
    
    uint256 private messageCounter;
    
    event MessageSent(address indexed sender, address indexed recipient, uint256 indexed messageId);
    
    function sendMessage(
        address recipient,
        externalEuint64 encryptedMessage,
        bytes calldata inputProof
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot send message to yourself");
        
        euint64 content = FHE.fromExternal(encryptedMessage, inputProof);
        
        uint256 messageId = messageCounter++;
        
        messages[messageId] = EncryptedMessage({
            encryptedContent: content,
            sender: msg.sender,
            recipient: recipient,
            timestamp: block.timestamp,
            exists: true
        });
        
        sentMessages[msg.sender].push(messageId);
        receivedMessages[recipient].push(messageId);
        
        FHE.allowThis(content);
        FHE.allow(content, recipient);
        
        emit MessageSent(msg.sender, recipient, messageId);
        
        return messageId;
    }
    
    function getMessage(uint256 messageId) external view returns (euint64) {
        EncryptedMessage storage message = messages[messageId];
        require(message.exists, "Message does not exist");
        require(msg.sender == message.recipient, "Only recipient can decrypt message");
        
        return message.encryptedContent;
    }
    
    function getMessageInfo(uint256 messageId) external view returns (
        address sender,
        address recipient,
        uint256 timestamp,
        bool canDecrypt
    ) {
        EncryptedMessage storage message = messages[messageId];
        require(message.exists, "Message does not exist");
        require(
            msg.sender == message.sender || msg.sender == message.recipient,
            "Not authorized to view message info"
        );
        
        return (
            message.sender,
            message.recipient,
            message.timestamp,
            msg.sender == message.recipient
        );
    }
    
    function getSentMessages() external view returns (uint256[] memory) {
        return sentMessages[msg.sender];
    }
    
    function getReceivedMessages() external view returns (uint256[] memory) {
        return receivedMessages[msg.sender];
    }
    
    function getSentMessagesCount() external view returns (uint256) {
        return sentMessages[msg.sender].length;
    }
    
    function getReceivedMessagesCount() external view returns (uint256) {
        return receivedMessages[msg.sender].length;
    }
    
    function getTotalMessagesCount() external view returns (uint256) {
        return messageCounter;
    }
}
