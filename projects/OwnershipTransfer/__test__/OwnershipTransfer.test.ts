import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { Config, algos, getOrCreateKmdWalletAccount } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

const fixture = algorandFixture();
Config.configure({ populateAppCallResources: true });


describe('OwnershipTransfer', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algorand } = fixture;

    // create accountA
    await getOrCreateKmdWalletAccount(
      { name: 'accountA', fundWith: algos(10) },
      algorand.client.algod,
      algorand.client.kmd
    );
    // Create accountB
    await getOrCreateKmdWalletAccount(
      { name: 'accountB', fundWith: algos(10) },
      algorand.client.algod,
      algorand.client.kmd
    );

  });

  test('Script test', async () => {
    const { algorand } = fixture;

    const accountA = await algorand.account.fromKmd('accountA');
    const accountB = await algorand.account.fromKmd('accountB');

    // Create a rekey transaction
    const suggestedParams = await algorand.client.algod.getTransactionParams().do();
    const rekeyTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: accountA.addr,
      to: accountA.addr,
      amount: 0,
      suggestedParams,
      rekeyTo:accountB.addr, // set the rekeyTo field to the new signer
    });
    // sign and send the transaction
    await algorand.client.algod.sendRawTransaction(rekeyTxn.signTxn(accountA.account.sk)).do();
    await algosdk.waitForConfirmation(algorand.client.algod, rekeyTxn.txID().toString(), 3);

    const acctInfo = await algorand.client.algod.accountInformation(accountA.addr).do();
    const addrs = (await algorand.account.getInformation(accountA.addr)).address;

    console.log(`accountA Address: ${addrs} Auth Addr: ${acctInfo['auth-addr']}`);
    console.log("accountB is set to sign accoutA txn(s)")
    // const toBeTransferded = (Number(bal) - Number(algos(0.5)))
    // console.log("bal: "+Number(bal)+" MBR: "+Number(algos(0.5))+" TBS: "+ toBeTransferded)
    const result =  await algorand.send.payment({
      sender: accountA.addr,
      receiver: accountB.addr,
      amount: algos(9.898),
      signer: accountB.account.signer,
    })
    expect(result.confirmation).toBeDefined();

    // check accountA balance
    const accountA_info = (await algorand.account.getInformation(accountA.addr));
    console.log("accountA Balance = "+ accountA_info.balance)
    // check accountB balance
    const accountB_info = (await algorand.account.getInformation(accountB.addr));
    console.log("accountB Balance = "+ accountB_info.balance)

  });

});
