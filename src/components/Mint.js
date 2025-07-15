import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner';
import { useState } from 'react'

import { ethers } from 'ethers'

const Mint = ({ provider, nft, cost, setIsLoading }) => {
  const [isWaiting, setIsWaiting] = useState(false)

  const mintHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()
      const tx = await nft.connect(signer).mint(1, { value: cost })
      await tx.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)          // automatically refreshes the page after loading
  }

  return(
    <Form onSubmit={mintHandler} style={{ maxWidth: '450px', margin: '50px auto'}}>
      {isWaiting ? (

          <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />

      ) : (

      <Form.Group>
        <Button variant="success" type="submit" style={{ width: '100%' }}>
          Mint
        </Button>
      </Form.Group>

      )}
    </Form>
  )
}

export default Mint;
