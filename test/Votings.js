const votings = artifacts.require("Voting");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {

    const _owner = accounts[0];
    const _voter1 = accounts[1];
    const _voter2 = accounts[2];
    let votingsInstance;


    context('when not Owner', async function () {
        before(async () => {
            votingsInstance = await votings.new({ from: _owner });
        })

        // Test that only owner can change worklfow, add/remove voter
        it('should revert', async function () {
            await expectRevert(votingsInstance.startProposalRegistration({ from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.endProposalRegistration({ from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.startVotingSession({ from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.endVotingSession({ from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.closeVoting({ from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.addVoter(_voter2, { from: _voter1 }), "Ownable: caller is not the owner");
            await expectRevert(votingsInstance.removeVoter(_voter2, { from: _voter1 }), "Ownable: caller is not the owner");
        })
    })

    context('when Owner', async function () {
        //each test is independant
        beforeEach(async () => {
            votingsInstance = await votings.new({ from: _owner });
        })

        // test that onwer can change the workflow following a specific order ( 0 to 5 )
        it("...should change workflow status and emit event from status 0 to 5", async function () {
            let r1 = await votingsInstance.startProposalRegistration({ from: _owner });
            expectEvent(r1, 'WorkflowStatusChange', { previousStatus: new BN(0), newStatus: new BN(1) })

            let r2 = await votingsInstance.endProposalRegistration({ from: _owner });
            expectEvent(r2, 'WorkflowStatusChange', { previousStatus: new BN(1), newStatus: new BN(2) })

            let r3 = await votingsInstance.startVotingSession({ from: _owner });
            expectEvent(r3, 'WorkflowStatusChange', { previousStatus: new BN(2), newStatus: new BN(3) })

            let r4 = await votingsInstance.endVotingSession({ from: _owner });
            expectEvent(r4, 'WorkflowStatusChange', { previousStatus: new BN(3), newStatus: new BN(4) })

            let r5 = await votingsInstance.closeVoting({ from: _owner });
            expectEvent(r5, 'WorkflowStatusChange', { previousStatus: new BN(4), newStatus: new BN(5) })

        })

        //add a voter
        it("should add voter1 to the list of voter and emit event", async function () {
            const r = await votingsInstance.addVoter(_voter1, { from: _owner });
            let voter1 = await votingsInstance._voters.call(_voter1);
            expect(voter1.isRegistered, 'voter1 should be registered').to.be.true;
            expectEvent(r, "VoterRegistered", { voterAddress: _voter1 });
        })

        // remove voter 1
        it("should remove voter1 from the list after adding it", async function () {
            await votingsInstance.addVoter(_voter1, { from: _owner });
            expect((await votingsInstance._voters.call(_voter1)).isRegistered, 'voter1 should be registered').to.be.true;
            await votingsInstance.removeVoter(_voter1, { from: _owner });
            expect((await votingsInstance._voters.call(_voter1)).isRegistered, 'voter1 should not be registered').to.be.false;
        })

        //confirm that a voter can't be added if status is not 'RegisteringVoters'
        it("should revert because adding voter is not possible when workflow status is not O (RegisteringVoters)", async function () {
            await votingsInstance.startProposalRegistration({ from: _owner });
            await expectRevert(votingsInstance.addVoter(_voter1, { from: _owner }), "It's not allowed to add voters");
        })

        //confirm that a voter can't be removed if status is not 'RegisteringVoters'
        it("should revert because removing voter is not possible when workflow status is not O (RegisteringVoters)", async function () {
            await votingsInstance.addVoter(_voter1, { from: _owner });
            await votingsInstance.startProposalRegistration({ from: _owner });
            await expectRevert(votingsInstance.removeVoter(_voter1, { from: _owner }), "It's not allowed to remove voters");
        })

        // confirm that a voting can't be close if status is not VotingSessionEnded
        it("should revert because close Voting is not possible when workflow status is not 4 (VotingSessionEnded)", async function () {
            await expectRevert(votingsInstance.closeVoting({ from: _owner }), "Current status is not voting session ended");
        })

        // test a workflow to confirm that a single proposal won
        it("should have 'vote for me' as winning proposal", async function () {
            await votingsInstance.addVoter(_voter1, { from: _owner });
            await votingsInstance.addVoter(_voter2, { from: _owner });
            await votingsInstance.startProposalRegistration({ from: _owner });
            await votingsInstance.addProposal('vote for me', { from: _voter1 })
            await votingsInstance.addProposal('vote for me too', { from: _voter1 })
            await votingsInstance.endProposalRegistration({ from: _owner });
            await votingsInstance.startVotingSession({ from: _owner });
            await votingsInstance.vote(0, { from: _voter1 });
            await votingsInstance.vote(0, { from: _voter2 });
            await votingsInstance.endVotingSession({ from: _owner });
            await votingsInstance.closeVoting({ from: _owner });

            winningProposals = await votingsInstance.winningProposal();
            let winningProposalsDescr = [];
            for (let winningProposal of winningProposals) {
                winningProposalsDescr.push(winningProposal.description);
            }

            expect(winningProposalsDescr, "'vote for me' should be the winning proposal").to.have.members(['vote for me']);

        })

        // test a workflow to confirm that 2 proposals won
        it("should have 'vote for me' and 'vote for me too' as winning proposal]", async function () {
            await votingsInstance.addVoter(_voter1, { from: _owner });
            await votingsInstance.addVoter(_voter2, { from: _owner });
            await votingsInstance.startProposalRegistration({ from: _owner });
            await votingsInstance.addProposal('vote for me', { from: _voter1 })
            await votingsInstance.addProposal('vote for me too', { from: _voter1 })
            await votingsInstance.endProposalRegistration({ from: _owner });
            await votingsInstance.startVotingSession({ from: _owner });
            await votingsInstance.vote(0, { from: _voter1 });
            await votingsInstance.vote(1, { from: _voter2 });
            await votingsInstance.endVotingSession({ from: _owner });
            await votingsInstance.closeVoting({ from: _owner });

            winningProposals = await votingsInstance.winningProposal();
            let winningProposalsDescr = [];
            for (let winningProposal of winningProposals) {
                winningProposalsDescr.push(winningProposal.description);
            }

            expect(winningProposalsDescr, "there should be 'vote for me' and 'vote for me too' as winning proposals").to.have.members(['vote for me', 'vote for me too']);

        })
    })

    context('when Voter', async function () {
        before(async () => {
            votingsInstance = await votings.new({ from: _owner });
        })

        //test that a proposal is correctly added
        it("should add proposal 'vote for me' and emit event", async function () {
            await votingsInstance.addVoter(_voter1, { from: _owner });
            await votingsInstance.addVoter(_voter2, { from: _owner });
            await votingsInstance.startProposalRegistration({ from: _owner });
            const r = await votingsInstance.addProposal('vote for me', { from: _voter1 });
            let proposals = await votingsInstance.viewProposals();
            let proposalsDescr = [];
            for (let proposal of proposals) {
                proposalsDescr.push(proposal.description)
            }

            expect(proposalsDescr, "'vote for me' should have been added as proposal").to.have.members(['vote for me']);
            expectEvent(r, "ProposalRegistered", { proposalId: new BN(0) });
        })

        //test that an other proposal is correctly added
        it("should add proposal 'vote for me too' and emit event", async function () {
            const r = await votingsInstance.addProposal('vote for me too', { from: _voter1 });
            let proposals = await votingsInstance.viewProposals();
            let proposalsDescr = [];
            for (let proposal of proposals) {
                proposalsDescr.push(proposal.description)
            }

            expect(proposalsDescr, "'vote for me' and 'vote for me too' should have been added as proposal").to.have.members(['vote for me', 'vote for me too']);
            expectEvent(r, "ProposalRegistered", { proposalId: new BN(1) });
        })

        // test a vote by a voter
        it("should add a vote by _voter1 to proposal 'vote for me' and emit event", async function () {
            await votingsInstance.endProposalRegistration({ from: _owner });
            await votingsInstance.startVotingSession({ from: _owner });

            // voter can't vote for proposal that doesn't exist
            await expectRevert.unspecified(votingsInstance.vote(2, { from: _voter1 }));

            const r = await votingsInstance.vote(0, { from: _voter1 });

            let proposals = await votingsInstance.viewProposals();

            expect(proposals[0].voteCount, "number of proposal should be equal to 1").to.be.bignumber.equal(new BN(1));

            expect((await votingsInstance._voters.call(_voter1)).hasVoted, 'voter1.hasVoted should be true').to.be.true;

            expect((await votingsInstance._voters.call(_voter1)).votedProposalId, 'voter1.votedProposalId should have vote for proposal index 0').to.be.bignumber.equal(new BN(0));

            expectEvent(r, "Voted", { voter: _voter1, proposalId: new BN(0) });
        })

        // confirm that a voter can't vote more than one time.
        it("should revert because _voter1 can't vote more than 1 time", async function () {
            await expectRevert(votingsInstance.vote(0, { from: _voter1 }), "You already voted");
        })

        // test a vote by a second voter
        it("should add a vote by _voter2 to proposal 'vote for me' and emit event", async function () {

            const r = await votingsInstance.vote(0, { from: _voter2 });

            let proposals = await votingsInstance.viewProposals();

            expect(proposals[0].voteCount).to.be.bignumber.equal(new BN(2), 'voteCount should be 2');

            expect((await votingsInstance._voters.call(_voter2)).hasVoted, 'voter1.hasVoted should be true').to.be.true;

            expect((await votingsInstance._voters.call(_voter2)).votedProposalId, 'voter1.votedProposalId should have vote for proposal index 0').to.be.bignumber.equal(new BN(0));

            expectEvent(r, "Voted", { voter: _voter2, proposalId: new BN(0) });
        })

    })

    context('when not Voter', async function () {
        before(async () => {
            votingsInstance = await votings.new({ from: _owner });
        })

        // confirm that a non registered voter can't add propospal and vote.
        it('should revert', async function () {
            await expectRevert(votingsInstance.addProposal('vote for me', { from: _voter1 }), "Sorry you are not allowed to send a proposal and vote");
            await expectRevert(votingsInstance.vote(0, { from: _voter1 }), "Sorry you are not allowed to send a proposal and vote");

        })
    })
})