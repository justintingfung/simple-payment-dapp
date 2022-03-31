declare global {
  interface Window {
    ethereum: any;
  }
}

import type { NextPage } from 'next'
import { ReactChild, ReactFragment, ReactPortal, SetStateAction, useEffect, useState } from 'react'
// import Head from 'next/head'
// import Image from 'next/image'
import { ethers, utils } from "ethers"

import abi from "../contracts/Payment.json"

import styles from '../styles/Home.module.css'

interface InputValueStorage {
  withdraw: string;
  deposit: string;
  newFriendName: string;
  newFriendWalletAddress: string;
  transferAmount: string;
}

interface Friend {
  name: string;
  walletAddress: string;
}

const Home: NextPage = () => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<InputValueStorage>({
    withdraw: "", deposit: "", newFriendName: "", newFriendWalletAddress: "", transferAmount: "",
  });
  const [customerTotalBalance, setCustomerTotalBalance] = useState<string>();
  const [customerFriendList, setCustomerFriendList] = useState<any>();
  const [customerAddress, setCustomerAddress] = useState<string>();
  const [selectedFriend, setSelectedFriend] = useState<Friend>();
  const [error, setError] = useState<string>();

  const contractAddress = '0x8FAF7EFD8752497253603a4D24C6b85E0066DB97';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account Connected: ", account);
      } else {
        setError("Please install a MetaMask wallet to use our bank.");
        console.log("No Metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const customerBalanceHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let balance = await bankContract.getCustomerBalance();
        setCustomerTotalBalance(utils.formatEther(balance));
        console.log("Retrieved balance...", balance);

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const customerFriendListHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let friendList = await bankContract.getCustomerFriendList();
        const friendListParsed = (friendList || []).map((item: { name: any; friendAccount: any }) => ({ name: utils.parseBytes32String(item.name), walletAddress: item.friendAccount }))
        setCustomerFriendList(friendListParsed);
        console.log("Retrieved friend list...", friendListParsed);

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleInputChange = (event: { target: { name: any; value: any } }) => {
    setInputValue(prevFormData => ({ ...prevFormData, [event.target.name]: event.target.value }));
  }

  const deposityMoneyHandler = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        //write data
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const txn = await bankContract.depositMoney({ value: ethers.utils.parseEther(inputValue.deposit) });
        console.log("Deposting money...");
        await txn.wait();
        console.log("Deposited money...done", txn.hash);

        customerBalanceHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const withDrawMoneyHandler = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let myAddress = await signer.getAddress()
        console.log("provider signer...", myAddress);

        const txn = await bankContract.withDrawMoney(myAddress, ethers.utils.parseEther(inputValue.withdraw));
        console.log("Withdrawing money...");
        await txn.wait();
        console.log("Money with drew...done", txn.hash);

        customerBalanceHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const addFriendHandler = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const txn = await bankContract.addFriend(utils.formatBytes32String(inputValue.newFriendName), inputValue.newFriendWalletAddress);
        await txn.wait();

        customerFriendListHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleSelectFriend = (item: Friend) => {
    if (item.name !== selectedFriend?.name || item.walletAddress !== selectedFriend?.walletAddress) {
      setSelectedFriend(item)
    } else {
      setSelectedFriend(undefined)
    }
  }

  const transferETHHandler = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const txn = await bankContract.transferMoney(selectedFriend?.walletAddress, ethers.utils.parseEther(inputValue.transferAmount));
        await txn.wait();

        customerBalanceHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    customerBalanceHandler()
    customerFriendListHandler()
  }, [isWalletConnected])

  return (
    <main className=" w-full">
      <h1 className="text-center m-10 text-white text-3xl">Simple Payment Project</h1>
      <section className="customer-section m-10 p-5 bg-white rounded-lg max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">My Account</h1>
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5 flex justify-between items-start flex-wrap">
          {isWalletConnected && (
            <div>
              <p><span className="font-bold">Account Balance: </span><span className='font-bold text-lg'>{customerTotalBalance} ETH</span></p>
              <p><span className="font-bold">Wallet Address: </span>{customerAddress}</p>
            </div>
          )}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected 🔒" : "Connect Wallet 🔑"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-5 mt-8">
          <div className="">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="deposit"
                placeholder="0.0000 ETH"
                value={inputValue.deposit}
              />
              <button
                className="btn-purple"
                onClick={deposityMoneyHandler}>Deposit Money In ETH</button>
            </form>
          </div>
          <div className="">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="withdraw"
                placeholder="0.0000 ETH"
                value={inputValue.withdraw}
              />
              <button
                className="btn-purple"
                onClick={withDrawMoneyHandler}>
                Withdraw Money In ETH
              </button>
            </form>
          </div>
        </div>
      </section>
      <section className="customer-section m-10 p-5 bg-white rounded-lg max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">My Friends</h1>
        <div className="mt-8">
          <form className="form-style flex flex-row justify-between">
            <div className='flex-1'>
              <input
                type="text"
                className="input-style block w-full"
                onChange={handleInputChange}
                name="newFriendName"
                placeholder="Name"
                value={inputValue.newFriendName}
              />
              <input
                type="text"
                className="input-style block w-full rounded-t-none rounded-b-lg"
                onChange={handleInputChange}
                name="newFriendWalletAddress"
                placeholder="Wallet Address"
                value={inputValue.newFriendWalletAddress}
              />
            </div>
            <button
              className="btn-purple rounded-t-lg ml-5"
              onClick={addFriendHandler}>Add Friend</button>
          </form>
        </div>
        <div className="my-8 overflow-auto">
          <table className='w-full'>
            <thead className='border-b-2'>
              <tr>
                <td></td>
                <td>Name</td>
                <td>Wallet Address</td>
              </tr>
            </thead>
            <tbody>
              {(customerFriendList || []).map((item: { name: string, walletAddress: string }, idx: number) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      onChange={() => handleSelectFriend(item)}
                      checked={selectedFriend?.name === item.name && selectedFriend?.walletAddress === item.walletAddress}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.walletAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr></hr>
        <div className="my-8">
          <p className='text-lg font-bold mb-5'>Select a friend above and transfer ETH to them!</p>
          <form className="form-style flex flex-row justify-between">
            <div className='flex-1 flex items-center flex-wrap'>
              <span className='font-bold text-lg mr-2'>Transfer</span>
              <input
                type="text"
                className="input-style rounded-b-lg mr-2"
                onChange={handleInputChange}
                name="transferAmount"
                placeholder="ETH"
                value={inputValue.transferAmount}
              />
              <span className='font-bold text-lg'>{`ETH to ${selectedFriend?.name || '[Friend Name]'}`}</span>
            </div>
            <button
              className={`btn-purple rounded-t-lg ml-5 ${selectedFriend == null ? 'bg-gray-500 hover:bg-gray-400' : ''}`}
              disabled={selectedFriend == null}
              onClick={transferETHHandler}>Confirm</button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Home
