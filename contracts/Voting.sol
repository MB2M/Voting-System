// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/** 
    @title Voting system
    @author MB2M
    @notice This contract manage a voting process. Owner add voters and is responsible of the workflow
    @dev 
 */

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

    /** 
        @notice View the status of a potential voter
     */ 

    mapping(address => Voter) public voters;

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;

    Proposal[] _proposals;
    uint256[] _winningProposalId;

    /**
        @notice event emited when a voter is registered by owner
        @param _voterAddress address of the voter
     */
    event VoterRegistered(address _voterAddress);

    /**
        @notice event emited when the owner change the state of the workflow
        @param _previousStatus previous workflow state
        @param _newStatus new workflow state
     */
    event WorkflowStatusChange(
        WorkflowStatus _previousStatus,
        WorkflowStatus _newStatus
    );

    /**
        @notice event emited when a new proposal is registered
        @param _proposalId id of the registered proposal
     */
    event ProposalRegistered(uint256 _proposalId);

    /**
        @notice event emited when a Voter vote
        @param _voter address of the voter
        @param _proposalId id of the voted proposal
     */
    event Voted(address _voter, uint256 _proposalId);


    /// @dev Only voter with .isRegistered
    modifier onlyVoters() {
        require(
            voters[msg.sender].isRegistered,
            "Sorry you are not allowed to send a proposal and vote"
        );
        _;
    }

    /**
        @notice Change the workflow of the voting to ProposalsRegistrationStarted
        @dev Based on the enum WorkflowStatus
     */
    function startProposalRegistration() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Current status is not voters registration"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            workflowStatus
        );
    }

    /**
        @notice Change the workflow of the voting to ProposalsRegistrationEnded
        @dev Based on the enum WorkflowStatus
     */
    function endProposalRegistration() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Current status is not proposals registration"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;

        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            workflowStatus
        );
    }

    /**
        @notice Change the workflow of the voting to VotingSessionStarted
        @dev Based on the enum WorkflowStatus
     */
    function startVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Current status is not proposals registration ended"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;

        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            workflowStatus
        );
    }

    /**
        @notice Change the workflow of the voting to VotingSessionEnded
        @dev Based on the enum WorkflowStatus
     */
    function endVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Current status is not voting session"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            workflowStatus
        );
    }

    /**
        @notice Last step of the workflow. Count the winning proposal. Close the voting session.
        @dev Based on the enum WorkflowStatus.
        the loop for manage the case where there is an equality
     */

    function closeVoting() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );
        workflowStatus = WorkflowStatus.VotesTallied;
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
            workflowStatus
        );
    }

    /**
        @notice Add a voter
        @dev Set Voter.isRegistered to true for the _address in param
        Revert if voter is already registered.
        @param _address Address of the future voter.
     */
    function addVoter(address _address) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "It's not allowed to add voters"
        );
        Voter storage voter = voters[_address];
        require(!voter.isRegistered, "voter already registered");
        voter.isRegistered = true;

        emit VoterRegistered(_address);
    }

    /**
        @notice Remove a voter
        @dev Set Voter.isRegistered to false for the _address in param
        Revert if voter is already unregistered.
        @param _address Address of the selected current voter.
     */
    function removeVoter(address _address) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "It's not allowed to remove voters"
        );
        Voter storage voter = voters[_address];
        require(voter.isRegistered, "voter not registered");
        voter.isRegistered = false;
    }

    /**
        @notice add a proposal
        @param _description description of the proposal
     */
    function addProposal(string memory _description) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "It's not allowed to add proposal"
        );
        Proposal memory proposal = Proposal(_description, 0);
        _proposals.push(proposal);

        emit ProposalRegistered(_proposals.length - 1);
    }

    /**
        @notice voter vote for a proposal
        @dev set Voter.hasVoted to true.  set the id of the proposal to Voter.votedProposalId
        @param _proposalId id of the proposal
     */
    function vote(uint256 _proposalId) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "It's not allowed to vote"
        );
        Voter storage voter = voters[msg.sender];
        require(!voter.hasVoted, "You already voted");
        require(_proposalId < _proposals.length);

        _proposals[_proposalId].voteCount++;
        voter.hasVoted = true;
        voter.votedProposalId = _proposalId;

        emit Voted(msg.sender, _proposalId);
    }

    /**
        @notice view the winning proposal(s)
        @return winner an array of proposals.
     */
    function winningProposal() public view returns (Proposal[] memory winner) {
        require(
            workflowStatus == WorkflowStatus.VotesTallied,
            "Vote not ended"
        );
        uint256 size = _winningProposalId.length;
        Proposal[] memory winProposals = new Proposal[](size);
        for (uint256 i = 0; i < _winningProposalId.length; i++) {
            winProposals[i] = _proposals[_winningProposalId[i]];
        }
        return winProposals;
    }

    /**
        @notice view all the proposals
        @return proposals an array of proposals.
     */
    function viewProposals() public view returns (Proposal[] memory proposals) {
        return _proposals;
    }
}
