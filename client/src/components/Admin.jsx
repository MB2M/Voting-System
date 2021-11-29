import React, { useEffect, useLayoutEffect, useState, useRef } from "react"
import AdminRegister from "./AdminRegister"

function Admin({ votingStatus, state, handleEvent, status }) {

    const handleButtonClick = async (i) => {
        let next;
        try {
            switch (i) {
                case 0:
                    next = await state.contract.methods.startProposalRegistration().send({ from: state.accounts[0] });
                    break;
                case 1:
                    next = await state.contract.methods.endProposalRegistration().send({ from: state.accounts[0] });
                    break;
                case 2:
                    next = await state.contract.methods.startVotingSession().send({ from: state.accounts[0] });
                    break;
                case 3:
                    next = await state.contract.methods.endVotingSession().send({ from: state.accounts[0] });
                    break;
                case 4:
                    next = await state.contract.methods.closeVoting().send({ from: state.accounts[0] });
                    break;
                default:
                    break;
            }

            let status = next.events.WorkflowStatusChange.returnValues._newStatus
            let message = `Workflow status is updated to ${status}`
            handleEvent(message)

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="row mt-5 border p-2 align-items-center">
            <h1 className="admin__title">Admin Zone</h1>
            <div className="col-3 admin__workflow d-grid gap-2 ">
                {[0, 1, 2, 3, 4].map((i) => {
                    return (
                        <button onClick={() => handleButtonClick(i)}
                            key={i}
                            className={"btn " + (votingStatus === i ? "btn-primary" : "btn-info")}
                            disabled={votingStatus != i && true}>
                            {status[i].buttonText}
                        </button>
                    )
                })}
            </div>
            <div className="col-9">
                {votingStatus === 0 && <AdminRegister state={state} handleEvent={handleEvent} status={status} />}
            </div>

        </div>
    )

}

export default Admin