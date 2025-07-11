const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Token', () => {
  const NAME = 'Tangle Punks'
  const SYMBOL = 'TP'
  const COST = ether(10)
  const MAX_SUPPLY = 25
  const BASE_URI = 'ipfs://bafybeibzbvazpuh55f67cnoabsusjzwwp545stdzxtkhd3wyc26oauv5ma/'

  let nft,   // nft SC
      deployer,
      minter

  beforeEach(async () => {      // hook
      let accounts = await ethers.getSigners()
      deployer = accounts[0]
      minter = accounts[1]
    })

  describe('Deployment', () => {
    const ALLOW_MINTING_ON = (Date.now() + 3600000).toString().slice(0, 10)  // 2 minutes from now

    beforeEach(async () => {      // hook
      const NFT = await ethers.getContractFactory('NFT')    // fetch SC
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy
    })

    it('has correct name', async () => {
      expect(await nft.name()).to.eq(NAME)
    })

    it('has correct symbol', async () => {
      expect(await nft.symbol()).to.eq(SYMBOL)
    })

    it('returns the cost to mint', async () => {
      expect(await nft.cost()).to.eq(COST)
    })
    
    it('returns the maximum supply', async () => {
      expect(await nft.maxSupply()).to.eq(MAX_SUPPLY)
    })

    it('returns the allow minitng time', async () => {
      expect(await nft.allowMintingOn()).to.eq(ALLOW_MINTING_ON)
    })

    it('returns the base URI', async () => {
      expect(await nft.baseURI()).to.eq(BASE_URI)
    })

    it('returns the owner', async () => {
      expect(await nft.owner()).to.eq(deployer.address)
    })

  })

  describe('Minting', () => {
    let transaction, result

    describe('Success', async () => {

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now

      beforeEach(async () => {      // hook
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        transaction = await nft.connect(minter).mint(1, { value: COST })
        result = await transaction.wait()
      })

      it('returns the address of the minter', async () => {
        expect(await nft.ownerOf(1)).to.eq(minter.address)        // function ownerOf (uint _tokenId) in ERC721 contract
      })                                                          // so we're just passing 1

      it('returns total number of tokens minter owns', async () => {
        expect(await nft.balanceOf(minter.address)).to.eq(1)      // function balanceOf is reverse to ownerOf (here in the test)
      })

      it('returns IPFS URI', async () => {
        console.log(await nft.tokenURI(1))
        // EG: 'ipfs://bafybeibzbvazpuh55f67cnoabsusjzwwp545stdzxtkhd3wyc26oauv5ma/1.json'
        expect(await nft.tokenURI(1)).to.eq(`${BASE_URI}1.json`)
      })

      it('updates the total supply', async () => {
        expect(await nft.totalSupply()).to.eq(1)
      })

      it('updates the SC ether balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.eq(COST)
      })

      it('emits mint event', async () => {
        await expect(transaction).to.emit(nft, 'Mint')
          .withArgs(1, minter.address)
      })

    })

    describe('Failure', async () => {
    
      it('rejects insufficient payment', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be.reverted
        result = await transaction.wait()
      })

      it('requires at least 1 NFT to be minted', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        await expect(nft.connect(minter).mint(0, { value: COST })).to.be.reverted
      })

      it('rejects minting before allowed time', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        await expect(nft.connect(minter).mint(1, { value: COST })).to.be.reverted
        result = await transaction.wait()
      })

      it('does not allow minting more than maxSupply of 25', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        await expect(nft.connect(minter).mint(100, { value: COST })).to.be.reverted
      })

      it('does not return URI for invalid tokens', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy
        nft.connect(minter).mint(1, { value: COST })

        await expect(nft.tokenURI('99')).to.be.reverted
      })




    })

  })

  describe('Displaying NFTs', () => {
    let transaction, result

    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now

    beforeEach(async () => {      // hook
      const NFT = await ethers.getContractFactory('NFT')    // fetch SC
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

      transaction = await nft.connect(minter).mint(3, { value: ether(30) })
      result = await transaction.wait()
    })

    it('returns all the NFTs for a given owner', async () => {
      let tokenIds = await nft.walletOfOwner(minter.address)
      console.log("owner wallet", tokenIds)
      expect(tokenIds.length).to.eq(3)
      console.log(tokenIds[0])
      expect(tokenIds[0].toString()).to.eq('1')
      expect(tokenIds[1].toString()).to.eq('2')
      expect(tokenIds[2].toString()).to.eq('3')
    })

  })

  describe('Minting', () => {

    describe('Success', async () => {

      let transaction, result, balanceBefore

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now

      beforeEach(async () => {      // hook
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        transaction = await nft.connect(minter).mint(1, { value: COST })
        result = await transaction.wait()

        balanceBefore = await ethers.provider.getBalance(deployer.address)

        transaction = await nft.connect(deployer).withdraw()
        result = await transaction.wait()
      })

      it('deduct the contract balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(0)
      })

      it('sends funds to the owner', async () => {
        expect(await ethers.provider.getBalance(deployer.address)).to.be.gt(balanceBefore)
      })

      it('emits a withdraw event', async () => {
        expect(transaction).to.emit(nft, 'Withdraw')
          .withArgs(COST, deployer.address)
      })
    })

    describe('Failure', async () => {

      it('prevents non-owner from withdrawing', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)  // now
        const NFT = await ethers.getContractFactory('NFT')    // fetch SC
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)    // deploy

        await expect(nft.connect(minter).withdraw()).to.be.reverted
      })

    })

  })

})
