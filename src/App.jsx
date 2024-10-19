"use client"

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { IExecWeb3mail, getWeb3Provider } from '@iexec/web3mail';

// get web3 provider from a private key
const web3Provider = getWeb3Provider('YOUR_PRIVATE_KEY');
// instantiate
const web3mail = new IExecWeb3mail(web3Provider);

// ABI of your Solidity contract (this is a placeholder, replace with your actual ABI)
const contractABI = [
  "function placeBet(uint256 betId, bool prediction) public payable",
  "function getBets() public view returns (tuple(uint256 id, string question, uint256 yesCount, uint256 noCount)[])",
  "function createBet(string memory question) public"
]

const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [signer, setSigner] = useState(null)
  const [bets, setBets] = useState([])
  const [newBetQuestion, setNewBetQuestion] = useState("")
  const [customPredictions, setCustomPredictions] = useState([])
  const [account, setAccount] = useState("")

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    if (isConnected) {
      fetchBets()
    }
  }, [isConnected])

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const signer = provider.getSigner()
          setSigner(signer)
          setIsConnected(true)
          setAccount(accounts[0])
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        setSigner(signer)
        setIsConnected(true)
        setAccount(address)
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        })
      } catch (error) {
        console.error("Failed to connect to wallet:", error)
        toast({
          title: "Connection Failed",
          description: "Failed to connect to MetaMask. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive",
      })
    }
  }

  const fetchBets = async () => {
    if (signer) {
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      try {
        const fetchedBets = await contract.getBets()
        setBets(fetchedBets)
      } catch (error) {
        console.error("Error fetching bets:", error)
        toast({
          title: "Error",
          description: "Failed to fetch bets. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const placeBet = async (betId, prediction) => {
    if (signer) {
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      try {
        const tx = await contract.placeBet(betId, prediction, { value: ethers.utils.parseEther("0.1") })
        await tx.wait()
        fetchBets() // Refresh bets after placing a new one
        toast({
          title: "Bet Placed",
          description: "Your bet has been successfully placed.",
        })
      } catch (error) {
        console.error("Error placing bet:", error)
        toast({
          title: "Error",
          description: "Failed to place bet. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const createNewBet = async () => {
    if (signer && newBetQuestion) {
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      try {
        const tx = await contract.createBet(newBetQuestion)
        await tx.wait()
        setNewBetQuestion("")
        fetchBets() // Refresh bets after creating a new one
        toast({
          title: "Bet Created",
          description: "Your new bet has been successfully created.",
        })
      } catch (error) {
        console.error("Error creating new bet:", error)
        toast({
          title: "Error",
          description: "Failed to create new bet. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const addCustomPrediction = () => {
    if (newBetQuestion) {
      setCustomPredictions([...customPredictions, { question: newBetQuestion, yesCount: 0, noCount: 0 }])
      setNewBetQuestion("")
      toast({
        title: "Custom Prediction Added",
        description: "Your custom prediction has been added.",
      })
    }
  }

  const voteOnCustomPrediction = (index, vote) => {
    const updatedPredictions = [...customPredictions]
    if (vote === 'yes') {
      updatedPredictions[index].yesCount++
    } else {
      updatedPredictions[index].noCount++
    }
    setCustomPredictions(updatedPredictions)
    toast({
      title: "Vote Recorded",
      description: `Your vote for "${vote}" has been recorded.`,
    })
  }

  const calculatePercentage = (yesCount, noCount) => {
    const total = yesCount + noCount
    if (total === 0) return { yes: 0, no: 0 }
    const yesPercentage = (yesCount / total) * 100
    return {
      yes: yesPercentage.toFixed(1),
      no: (100 - yesPercentage).toFixed(1)
    }
  }

  const adCards = [
    { title: "2024 Presidential Election Forecast", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/presidential-dm39A4TuVLqw6hnuJOiy4oYaxVZwuc.png" },
    { title: "Global Recession in 2024", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/globalRecession-E2Flo5sHywsfeOh3v8Vz3tFe3FJtIa.png" },
    { title: "Sports Elections", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sports-MSryG2qErDHibfcT5pFoFSnJaR8tT4.png" },
  ]

  const sendEmail = web3mail.sendEmail({
    protectedData: '0x123abc...',
    emailSubject: 'Redeem',
    emailContent: 'Please claim your bet from MarketSense.com',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <header className="flex justify-between items-center p-4 bg-white bg-opacity-10 backdrop-blur-md">
        <div className="flex items-center">
          <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-2xl font-bold text-white">MarketSense</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={sendEmail} className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3">
            Redeem
          </Button>
          <Button onClick={connectWallet} variant="outline" className="bg-white text-purple-600 hover:bg-purple-100">
            {isConnected ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adCards.map((ad, index) => (
              <Card key={index} className="bg-white bg-opacity-20 backdrop-blur-md text-white overflow-hidden">
                <img src={ad.image} alt={ad.title} className="w-full h-40 object-cover" />
                <CardHeader>
                  <CardTitle>{ad.title}</CardTitle>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">View</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        
        <div className="mb-8 bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4">
          <h2 className="text-2xl font-bold text-white mb-4">Create Custom Prediction</h2>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter your prediction question"
              value={newBetQuestion}
              onChange={(e) => setNewBetQuestion(e.target.value)}
              className="flex-grow bg-white bg-opacity-50 text-black placeholder-gray-500"
            />
            <Button onClick={addCustomPrediction} className="bg-purple-600 hover:bg-purple-700 text-white">
              Add
            </Button>
            {isConnected && (
              <Button onClick={createNewBet} className="bg-blue-600 hover:bg-blue-700 text-white">
                Create On-Chain
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {customPredictions.map((prediction, index) => {
            const percentages = calculatePercentage(prediction.yesCount, prediction.noCount)
            return (
              <Card key={index} className="bg-white bg-opacity-20 backdrop-blur-md text-white">
                <CardHeader>
                  <CardTitle>{prediction.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes: {percentages.yes}%</p>
                  <p>No: {percentages.no}%</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={() => voteOnCustomPrediction(index, 'yes')} variant="secondary" className="bg-green-500 hover:bg-green-600">
                    Yes ({percentages.yes}%)
                  </Button>
                  <Button onClick={() => voteOnCustomPrediction(index, 'no')} variant="secondary" className="bg-red-500 hover:bg-red-600">
                    No ({percentages.no}%)
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bets.map((bet) => {
            const percentages = calculatePercentage(bet.yesCount.toNumber(), bet.noCount.toNumber())
            return (
              <Card key={bet.id} className="bg-white bg-opacity-20 backdrop-blur-md text-white">
                <CardHeader>
                  <CardTitle>{bet.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes: {percentages.yes}%</p>
                  <p>No: {percentages.no}%</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={() => placeBet(bet.id, true)} variant="secondary" className="bg-green-500 hover:bg-green-600">
                    Yes ({percentages.yes}%)
                  </Button>
                  <Button onClick={() => placeBet(bet.id, false)} variant="secondary" className="bg-red-500 hover:bg-red-600">
                    No ({percentages.no}%)
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}