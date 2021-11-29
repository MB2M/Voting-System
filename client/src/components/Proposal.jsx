import React, { useEffect, useState } from "react"

function Proposal({ proposal, children, badge }) {

    return (
        <>
            <h5>{proposal.description} {badge}</h5>
            <div className="d-flex justify-content-around">
                <span>{proposal.voteCount} voters</span>
                {children}
            </div>
        </>
    )

}

export default Proposal