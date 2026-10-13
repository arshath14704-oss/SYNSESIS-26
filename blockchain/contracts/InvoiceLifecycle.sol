// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InvoiceLifecycle
 * @dev Hybrid on-chain anchor for InvoiceTrust AI.
 * Off-chain invoice documents stay private and secure in local storage;
 * only canonical SHA-256 state commitments, fingerprints, and state transitions
 * are permanently recorded to prevent double-financing.
 */
contract InvoiceLifecycle {
    enum InvoiceStatus { Submitted, Verified, Approved, Financed, Repaid, Disputed }

    struct InvoiceCommitment {
        bytes32 invoiceHash;
        bytes32 fingerprint;
        uint256 amount;
        InvoiceStatus status;
        address registeredBy;
        uint256 timestamp;
        string lenderId;
    }

    address public immutable owner;
    
    // Mapping from invoice ID (as bytes32) to commitment
    mapping(bytes32 => InvoiceCommitment) public commitments;
    // Mapping from canonical financial fingerprint to registered invoice ID (detects collisions)
    mapping(bytes32 => bytes32) public fingerprintRegistry;

    event CommitmentAnchored(bytes32 indexed invoiceId, bytes32 indexed fingerprint, uint256 amount, InvoiceStatus status, uint256 timestamp);
    event StatusUpdated(bytes32 indexed invoiceId, InvoiceStatus newStatus, uint256 timestamp);
    event DuplicateCollisionDetected(bytes32 indexed fingerprint, bytes32 existingInvoiceId, bytes32 attemptedInvoiceId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchorInvoice(
        bytes32 invoiceId,
        bytes32 invoiceHash,
        bytes32 fingerprint,
        uint256 amount,
        string calldata lenderId
    ) external returns (bool) {
        bytes32 existingId = fingerprintRegistry[fingerprint];
        if (existingId != bytes32(0)) {
            emit DuplicateCollisionDetected(fingerprint, existingId, invoiceId);
            return false;
        }

        commitments[invoiceId] = InvoiceCommitment({
            invoiceHash: invoiceHash,
            fingerprint: fingerprint,
            amount: amount,
            status: InvoiceStatus.Submitted,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            lenderId: lenderId
        });

        fingerprintRegistry[fingerprint] = invoiceId;
        emit CommitmentAnchored(invoiceId, fingerprint, amount, InvoiceStatus.Submitted, block.timestamp);
        return true;
    }

    function updateStatus(bytes32 invoiceId, InvoiceStatus newStatus) external {
        require(commitments[invoiceId].timestamp > 0, "Invoice not found");
        commitments[invoiceId].status = newStatus;
        emit StatusUpdated(invoiceId, newStatus, block.timestamp);
    }

    function getCommitment(bytes32 invoiceId) external view returns (InvoiceCommitment memory) {
        return commitments[invoiceId];
    }
}
