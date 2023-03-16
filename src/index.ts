import { Blockchain } from '@ethereumjs/blockchain'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { EVM } from '@ethereumjs/evm'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { EEI } from '@ethereumjs/vm'
import { Address, toBuffer, zeros } from '@ethereumjs/util'
import Opcodes from './opcodes.json'
import { addressToBuffer } from '@ethereumjs/evm/dist/opcodes'
import Web3 from 'web3';

const main = async () => {
  const common = new Common({ 
    chain: Chain.Mainnet,
    hardfork: Hardfork.London,
  })
  const stateManager = new DefaultStateManager()
  const blockchain = await Blockchain.create()
  const eei = new EEI(stateManager, common, blockchain)

  // Fund account
  const web3 = new Web3()
  const fundedAddress = Address.fromString(web3.eth.accounts.create().address)
  const account = await stateManager.getAccount(fundedAddress)
  account.balance = BigInt('0x1000000000000000000')
  await stateManager.putAccount(fundedAddress, account)

  console.warn((await stateManager.getAccount(fundedAddress)).balance)

  const evm = new EVM({
    common,
    eei,
  })

  // const { STOP, ADD, PUSH1 } = Opcodes;

  // Note that numbers added are hex values, so '20' would be '32' as decimal e.g.
  evm.events.on('newContract', async function (data) {
    console.log(data)
  });  

  evm.events.on('step', async function (data) {
    // console.log(data)
    // Note that data.stack is not immutable, i.e. it is a reference to the vm's internal stack object
    // console.log(data.address.buf.toString('hex'))
    console.log(`Opcode: ${data.opcode.name}\tStack: ${data.stack}`);
    // console.log(`Mem: ${data.memory.toString('hex')}`)
    const trie = await stateManager._getStorageTrie(data.address);
    // trie.walkTrie(data.account.storageRoot, console.log)
    const storage = await stateManager.getContractStorage(data.address, Buffer.from(zeros(32)));
    console.log('s', storage.byteLength);
  });

  const bytecode = '608060405234801561001057600080fd5b5060008060006101000a81548160ff02191690831515021790555060ec806100396000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063cdff7d7914602d575b600080fd5b60336047565b604051603e9190609d565b60405180910390f35b60008060009054906101000a900460ff16156000806101000a81548160ff02191690831515021790555060008054906101000a900460ff16905090565b60008115159050919050565b6097816084565b82525050565b600060208201905060b060008301846090565b9291505056fea26469706673582212202acc9aec806b56123f6333dcc2a61194c7d34b2312da876b26d3ff2fcd2aec8c64736f6c63430008130033';
  const abi = [
    {
      "inputs":[],
      "stateMutability":"nonpayable",
      "type":"constructor"
    },
    {
      "inputs":[],
      "name":"flipValue",
      "outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"nonpayable",
      "type":"function"
    }
  ]

  async function deployContract(bytecode: string) {
    const results = await evm
      .runCall({
        origin: fundedAddress,
        caller: fundedAddress,
        gasPrice: BigInt(0xffff),
        gasLimit: BigInt(0xffffff),
        data: Buffer.from(bytecode, 'hex'),
      })

    console.log(`Address: ${results.createdAddress}`)
    console.log(`gasUsed: ${results.execResult.executionGasUsed.toString()}`)

    return results.createdAddress as Address
  }  

  const contractAddress = await deployContract(bytecode)

  console.log("\n\n\n\n\n\n")

  async function callContract(address: Address, callData: string) {
    const results = await evm
      .runCall({
        origin: fundedAddress,
        caller: fundedAddress,
        to: address,
        gasPrice: BigInt(0xffff),
        gasLimit: BigInt(0xffffff),
        data: Buffer.from(callData, 'hex'),
      });

    // console.warn(results.execResult);
    if(results.execResult.exceptionError) {
      console.error(results.execResult.exceptionError);
    }
    console.log(`Address: ${results.execResult.returnValue.toString('hex')}`)
    console.log(`gasUsed: ${results.execResult.executionGasUsed.toString()}`)
  }

  const contract = new web3.eth.Contract(abi as any);
  const encoded = contract.methods.flipValue().encodeABI().slice(2);

  await callContract(contractAddress, encoded);

  await callContract(contractAddress, encoded);  

  // async function runCode(code: string[]) {
  //   await evm
  //     .runCode({
  //       code: Buffer.from(code.join(''), 'hex'),        
  //       gasLimit: BigInt(0xffff),
  //     })
  //     .then((results) => {
  //       console.log(`Returned: ${results.returnValue.toString('hex')}`)
  //       console.log(`gasUsed: ${results.executionGasUsed.toString()}`)
  //     })
  //     .catch(console.error)
  // }

  // // Deploy a contract
  // await runCode([PUSH1, '03', PUSH1, '05', ADD, STOP])

  // // Run contract code
  // await runCode([PUSH1, '03', PUSH1, '05', ADD, STOP])
}

void main()
