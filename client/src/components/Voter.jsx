import React, { useRef, useState } from "react"

function Voter({ votingStatus, state, handleEvent, }) {
    const inputRef = useRef("");

    const handleSubmit = () => {
        (async () => {
            let proposal = inputRef.current.value
            if (proposal !== "") {
                const propose = await state.contract.methods.addProposal(proposal).send({ from: state.accounts[0] })
                let proposalId = propose.events.ProposalRegistered.returnValues._proposalId
                let message = `You proposal has been added to the list with id: ${proposalId}`
                handleEvent(message)
            }
        })()
    }

    return (
        <div className="voter">
            {votingStatus === 1 && (
                <>
                    <label htmlFor="proposalInput">Feel free to add a new proposal:</label>
                    <input id="proposalInput" type="text" ref={inputRef} className="form-control" />
                    <button className="btn btn-success" onClick={handleSubmit}>Propose</button>
                </>
            )}
        </div>
    )
}

export default Voter