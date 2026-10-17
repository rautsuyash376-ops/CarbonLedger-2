
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonLedger is Ownable {
    enum ProjectStatus {
        Pending,
        Verified,
        Rejected
    }

    struct Project {
        uint256 id;
        string name;
        string location;
        string evidenceURI;
        address developer;
        ProjectStatus status;
        uint256 issuedUnits;
        bool exists;
    }

    uint256 public nextProjectId = 1;
    uint256 public totalIssued;
    uint256 public totalRetired;

    mapping(uint256 => Project) public projects;
    mapping(address => bool) public verifiers;
    mapping(address => uint256) public balances;

    event ProjectRegistered(
        uint256 indexed projectId,
        address indexed developer,
        string name
    );

    event ProjectReviewed(
        uint256 indexed projectId,
        address indexed verifier,
        ProjectStatus status
    );

    event VerifierUpdated(address indexed verifier, bool authorized);

    event CreditsIssued(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );

    event CreditsTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event CreditsRetired(
        address indexed holder,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    modifier onlyVerifier() {
        require(
            msg.sender == owner() || verifiers[msg.sender],
            "Not an authorized verifier"
        );
        _;
    }

    function setVerifier(
        address verifier,
        bool authorized
    ) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");

        verifiers[verifier] = authorized;
        emit VerifierUpdated(verifier, authorized);
    }

    function registerProject(
        string calldata name,
        string calldata location,
        string calldata evidenceURI
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Project name required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(evidenceURI).length > 0, "Evidence reference required");

        uint256 projectId = nextProjectId++;

        projects[projectId] = Project({
            id: projectId,
            name: name,
            location: location,
            evidenceURI: evidenceURI,
            developer: msg.sender,
            status: ProjectStatus.Pending,
            issuedUnits: 0,
            exists: true
        });

        emit ProjectRegistered(projectId, msg.sender, name);
        return projectId;
    }

    function reviewProject(
        uint256 projectId,
        bool approved
    ) external onlyVerifier {
        Project storage project = projects[projectId];

        require(project.exists, "Project does not exist");
        require(
            project.status == ProjectStatus.Pending,
            "Project already reviewed"
        );

        project.status = approved
            ? ProjectStatus.Verified
            : ProjectStatus.Rejected;

        emit ProjectReviewed(
            projectId,
            msg.sender,
            project.status
        );
    }

    function issueCredits(
        uint256 projectId,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        Project storage project = projects[projectId];

        require(project.exists, "Project does not exist");
        require(
            project.status == ProjectStatus.Verified,
            "Project is not verified"
        );
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");

        project.issuedUnits += amount;
        totalIssued += amount;
        balances[recipient] += amount;

        emit CreditsIssued(projectId, recipient, amount);
    }

    function transferCredits(
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be positive");
        require(
            balances[msg.sender] >= amount,
            "Insufficient balance"
        );

        balances[msg.sender] -= amount;
        balances[recipient] += amount;

        emit CreditsTransferred(msg.sender, recipient, amount);
    }

    function retireCredits(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(
            balances[msg.sender] >= amount,
            "Insufficient balance"
        );

        balances[msg.sender] -= amount;
        totalRetired += amount;

        emit CreditsRetired(msg.sender, amount);
    }

    function outstandingUnits() external view returns (uint256) {
        return totalIssued - totalRetired;
    }
}
