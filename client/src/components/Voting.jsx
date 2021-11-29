import React, { useEffect, useLayoutEffect, useState } from "react"
import Admin from "./Admin";
import Proposals from "./Proposals"
import Voter from "./Voter";
import Proposal from "./Proposal";

function Voting({ state }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [voter, setVoter] = useState({})
    const [votingStatus, setVotingStatus] = useState(0)
    const [eventMessage, setEventMessage] = useState('')
    const [winningProposals, setWinningProposals] = useState([])


    const STATUS = {
        0: { label: "Voting has not started, whitelisting in progress", buttonText: "START PROPOSAL SESSION" },
        1: { label: "Please submit proposals", buttonText: "END PROPOSAL SESSION" },
        2: { label: "Proposal session has end, please wait for voting session to open", buttonText: "START VOTING SESSION" },
        3: { label: "Voting session is open, please vote", buttonText: "END VOTING SESSION" },
        4: { label: "Vote has ended, wait for counting", buttonText: "TALLY VOTE" },
        5: { label: "Result of the voting session" }
    }

    useEffect(() => {
        (async function () {
            await state.contract.events.WorkflowStatusChange()
                .on('data', event => {
                    let newStatus = event.returnValues._newStatus;
                    setVotingStatus(newStatus);
                })
                .on('changed', changed => console.log(changed))
                // .on('error', err => throw err)
                .on('connected', str => console.log(str))
        })()
    }, [])


    useEffect(() => {
        (async function () {
            let votingState = await state.contract.methods.workflowStatus().call()
            setVotingStatus(parseInt(votingState))
        })()
    })

    useEffect(() => {
        (async function () {
            let owner = await state.contract.methods.owner().call()

            if (state.accounts[0] === owner) {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }

            updateVoter()
        })()
    }, [state])


    useEffect(() => {
        if (votingStatus === 5) {
            getWinningProposals()
        }
    }, [votingStatus])

    const getWinningProposals = async () => {
        let winnings = await state.contract.methods.winningProposal().call()
        setWinningProposals(winnings)
    }

    const updateVoter = async () => {
        let voter = await state.contract.methods.voters(state.accounts[0]).call()
        setVoter(voter)
    }

    const handleEvent = (message) => {
        setEventMessage(message)
        const timer = setTimeout(() => setEventMessage(''), 5000)
        return () => clearTimeout(timer)
    }


    return (
        <div className="voting container">
            {eventMessage != "" && <div className="alert alert-primary">{eventMessage}</div>}
            <h1>{STATUS[votingStatus].label}</h1>
            {isAdmin && <Admin votingStatus={votingStatus} state={state} handleEvent={handleEvent} status={STATUS} />}
            {votingStatus === 5 &&
                <div>
                    <h5>Winning proposal(s):</h5>
                    <span>{winningProposals.map(p => <Proposal proposal={p}></Proposal>)}</span>
                </div>}
            <div className="vote-info row align-items-center mt-5 justify-content-center">
                <div className="col-4">
                    {votingStatus > 0 && <Proposals votingStatus={votingStatus} state={state} voter={voter} handleEvent={handleEvent} updateVoter={updateVoter} />}
                </div>
                <div className="col-7">
                    {voter && voter.isRegistered && <Voter votingStatus={votingStatus} state={state} handleEvent={handleEvent} />}
                </div>
            </div>
            
        </div>
    )
}

export default Voting