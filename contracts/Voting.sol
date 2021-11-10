// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedProposalId;
    }

    struct Proposal {
        string description;
        uint256 voteCount;
    }

    mapping(address => Voter) public _voters;

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus _workflowStatus = WorkflowStatus.RegisteringVoters;

    Proposal[] _proposals;
    uint256[] _winningProposalId;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint256 proposalId);
    event Voted(address voter, uint256 proposalId);

    modifier onlyVoters() {
        require(
            _voters[msg.sender].isRegistered,
            "Sorry you are not allowed to send a proposal and vote"
        );
        _;
    }

    function startProposalRegistration() external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.RegisteringVoters,
            "Current status is not voters registration"
        );
        _workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            _workflowStatus
        );
    }

    function endProposalRegistration() external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Current status is not proposals registration"
        );
        _workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;

        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            _workflowStatus
        );
    }

    function startVotingSession() external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Current status is not proposals registration ended"
        );
        _workflowStatus = WorkflowStatus.VotingSessionStarted;

        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            _workflowStatus
        );
    }

    function endVotingSession() external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Current status is not voting session"
        );
        _workflowStatus = WorkflowStatus.VotingSessionEnded;

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            _workflowStatus
        );
    }

    function closeVoting() external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );
        _workflowStatus = WorkflowStatus.VotesTallied;
        uint256 highestCount = 0;
        for (uint256 i = 0; i < _proposals.length; i++) {
            if (_proposals[i].voteCount == highestCount) {
                _winningProposalId.push(i);
            }
            if (_proposals[i].voteCount > highestCount) {
                _winningProposalId = [i];
                highestCount = _proposals[i].voteCount;
            }
        }

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            _workflowStatus
        );
    }

    function addVoter(address _address) external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.RegisteringVoters,
            "It's not allowed to add voters"
        );
        Voter storage voter = _voters[_address];
        require(!voter.isRegistered, "voter already registered");
        voter.isRegistered = true;

        emit VoterRegistered(_address);
    }

    function removeVoter(address _address) external onlyOwner {
        require(
            _workflowStatus == WorkflowStatus.RegisteringVoters,
            "It's not allowed to remove voters"
        );
        Voter storage voter = _voters[_address];
        require(voter.isRegistered, "voter not registered");
        voter.isRegistered = false;
    }

    function addProposal(string memory _description) external onlyVoters {
        require(
            _workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "It's not allowed to add proposal"
        );
        Proposal memory proposal = Proposal(_description, 0);
        _proposals.push(proposal);

        emit ProposalRegistered(_proposals.length - 1);
    }

    function vote(uint256 _proposalId) external onlyVoters {
        require(
            _workflowStatus == WorkflowStatus.VotingSessionStarted,
            "It's not allowed to vote"
        );
        Voter storage voter = _voters[msg.sender];
        require(!voter.hasVoted, "You already voted");
        require(_proposalId < _proposals.length);

        _proposals[_proposalId].voteCount++;
        voter.hasVoted = true;
        voter.votedProposalId = _proposalId;

        emit Voted(msg.sender, _proposalId);
    }

    function winningProposal() public view returns (Proposal[] memory winner) {
        require(
            _workflowStatus == WorkflowStatus.VotesTallied,
            "Vote not ended"
        );
        uint256 size = _winningProposalId.length;
        Proposal[] memory winProposals = new Proposal[](size);
        for (uint256 i = 0; i < _winningProposalId.length; i++) {
            winProposals[i] = _proposals[_winningProposalId[i]];
        }
        return winProposals;
    }

    function viewProposals() public view returns (Proposal[] memory proposals) {
        return _proposals;
    }
}
