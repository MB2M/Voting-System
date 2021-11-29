import React, { useEffect, useState } from "react"
import Proposal from "./Proposal";

function Proposals({ votingStatus, state, voter, handleEvent, updateVoter }) {
    const [proposals, setProposals] = useState([]);

    const subscribeProposalRegisteredEvent = async () => {
        await state.contract.events.ProposalRegistered()
            .on('data', event => {
                getProposals()
            })
            .on('changed', changed => console.log(changed))
            // .on('error', err => throw err)
            .on('connected', str => console.log(str))
    }

    const subscribeVotedEvent = async () => {
        await state.contract.events.Voted()
            .on('data', event => {
                getProposals()
            })
            .on('changed', changed => console.log(changed))
            // .on('error', err => throw err)
            .on('connected', str => console.log(str))
    }

    const getProposals = async () => {
        let proposals = await state.contract.methods.viewProposals().call()
        setProposals(proposals)
    }


    useEffect(() => {
        subscribeProposalRegisteredEvent();
        subscribeVotedEvent();
        getProposals();
    }, [])

    const handleClick = async (index) => {
        try {
            const vote = await state.contract.methods.vote(index).send({ from: state.accounts[0] })
            const voteEventProposalId = vote.events.Voted.returnValues._proposalId
            updateVoter()
            let message = `You have correctly voted for proposal ${proposals[voteEventProposalId][0]}`
            handleEvent(message)

        } catch (error) {
            console.error(error)
        }
    }


    return (
        <div className="proposal border">
            <h1>List of proposals:</h1>
            <h5><i>(Total: {proposals.length})</i></h5>
            <ul className="list-group">
                {proposals.map((p, i) =>
                    <li className="list-group-item" key={i}>
                        <Proposal 
                        proposal={p} 
                        badge={voter && voter.hasVoted && voter.votedProposalId == i && <span className="badge bg-success">Your Vote</span>}
                        VoteButton={votingStatus === 3 &&
                                (voter && !voter.hasVoted) &&
                                <button className="btn btn-success" onClick={() => handleClick(i)}>Vote for</button>}
                        >
                        </Proposal>
                    </li>
                )}
            </ul>
        </div>
    )
}

export default Proposals