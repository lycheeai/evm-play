import { Blockchain } from '@ethereumjs/blockchain'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { EVM } from '@ethereumjs/evm'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { EEI } from '@ethereumjs/vm'
import { Address, toBuffer } from '@ethereumjs/util'
import Opcodes from './opcodes.json'
import { addressToBuffer } from '@ethereumjs/evm/dist/opcodes'

const main = async () => {
  const common = new Common({ 
    chain: Chain.Mainnet,
    hardfork: Hardfork.London,
  })
  const stateManager = new DefaultStateManager()
  const blockchain = await Blockchain.create()
  const eei = new EEI(stateManager, common, blockchain)

  // Fund account
  const account0 = await stateManager.getAccount(Address.zero())
  account0.balance = BigInt('0x1000000000000000000')
  stateManager.putAccount(Address.zero(), account0)
  const account = await stateManager.getAccount(Address.zero())
  console.warn(account.balance)

  const evm = new EVM({
    common,
    eei,
  })

  // const { STOP, ADD, PUSH1 } = Opcodes;

  // // Note that numbers added are hex values, so '20' would be '32' as decimal e.g.

  // evm.events.on('step', async function (data) {
  //   // console.log(data)
  //   // Note that data.stack is not immutable, i.e. it is a reference to the vm's internal stack object
  //   console.log(data.address.buf.toString('hex'))
  //   console.log(`Opcode: ${data.opcode.name}\tStack: ${data.stack}\tMem: ${data.memory.toString('hex')}`);
  //   const storage = await stateManager.getContractStorage(data.address, data.account.storageRoot);
  //   console.log('s', storage.byteLength);
  // });

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
