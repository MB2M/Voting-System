import React, { useEffect, useLayoutEffect, useState, useRef } from "react"

function AdminRegister({ state, handleEvent }) {
    const whiteListRef = useRef()
    const [actualAddressMessage, setActualAddressMessage] = useState('')
    const [isInputAddress, setIsInputAddress] = useState(false)
    const [isWhiteListed, setIsWhiteListed] = useState(false)

    const handleSubmit = async (type) => {
        let address = whiteListRef.current.value
        try {
            switch (type) {
                case 'add':
                    const add = await state.contract.methods.addVoter(address).send({ from: state.accounts[0] });
                    let address_event = add.events.VoterRegistered.returnValues._voterAddress
                    let message = `Address ${address_event} has been added to the whitelist`
                    handleEvent(message)
                    handleInput()
                    break;
                case 'remove':
                    const remove = await state.contract.methods.removeVoter(address).send({ from: state.accounts[0] });
                    handleInput()
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log(error)
        }
    }

    const whiteListed = async (address) => {
        let voter = await state.contract.methods.voters(address).call()
        if (voter.isRegistered) {
            setIsWhiteListed(true)
            setActualAddressMessage('This address is whitelisted')
        } else {
            setActualAddressMessage('This address is NOT whitelisted')
            setIsWhiteListed(false)
        }
    }

    const handleInput = () => {
        let input = whiteListRef.current.value
        if (state.web3.utils.isAddress(input)) {
            setIsInputAddress(true)
            whiteListed(input)
        } else {
            setIsInputAddress(false)
            setActualAddressMessage('not a valid address')
            setIsWhiteListed(false)
        }
    }

    return (
        <div className="admin-register mx-auto">
            <label htmlFor="addressInput">Enter Address: </label>
            <input id="addressInput" type="text" ref={whiteListRef} onChange={handleInput} className="form-control" aria-describedby="addressHelpBlock" />
            <div id="addressHelpBlock" className="form-text"><span>{actualAddressMessage}</span></div>
            <div>
                {isInputAddress && (
                    !isWhiteListed ?
                        <button className="btn btn-success w-100" onClick={() => handleSubmit("add")}>add it</button> :
                        <button className="btn btn-danger" onClick={() => handleSubmit("remove")}>remove it</button>
                )}
            </div>
        </div>
    )

}

export default AdminRegister