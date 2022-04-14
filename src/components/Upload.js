import React, {useRef, useState} from 'react';
import { ethers } from "ethers";
import {
  useDisclosure,
  Button,
  Modal,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalOverlay,
  ModalContent,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  HStack,
  ModalFooter,
  useToast,
  Text
} from '@chakra-ui/react';
import {Buffer} from 'buffer'
import {create} from 'ipfs-http-client'

import abi from '../contracts/abi.json'
import contractAddress from '../contracts/contract_address.json'

const client = create('https://ipfs.infura.io:5001/api/v0')

const contractAddress = '0xF66E577305EE88B655589d0E5E0c211422b31b0a'

const Upload = () => {
  const {isOpen, onOpen, onClose} = useDisclosure ();
  const initialRef = useRef ();
  const finalRef = useRef ();
  const [fileName, setFileName] = useState('')
  const [type, setType] = useState('0')
  const [file, setFile] = useState(null)
  const [fileDetails, setFileDetails] = useState('')
  const [cid, setCid] = useState('')
  const [submitted, setSubmitted] = useState('')
  const toast = useToast()
  const captureFile = (e) => {
    const data = e.target.files[0]
    setFileDetails(data)
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      const f = Buffer(reader.result)
      console.log("File: ", f) 
      setFile(f)
    }
  }

  const fileUpload = async () => {
    try {
        const {ethereum} = window
        if(ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const fileUploadContract = new ethers.Contract(contractAddress.contractAddress, abi.abi, signer)

            console.log("CID: ", cid)
            console.log("file name: ", fileName)
            console.log("type: ", type)

            const fileUploadTxn = await fileUploadContract.fileUpload(cid, fileName, type)
            await fileUploadTxn.wait()

            

            await fileUploadContract.on("FileUploaded", (ipfsCID, fileName, timeUploaded , fileOwner) => {
              setSubmitted('Upload successful!')
              setTimeout(() => {
                setSubmitted('')
              }, 4000);
              
              console.log("ipfsCID: ", ipfsCID)
              console.log("fileName: ", fileName)
              console.log("timeUploaded: ", timeUploaded)
              console.log("fileOwner: ", fileOwner)
            })        
            

        } else{
            console.log('ethereum object does not exist!')
        }
    } catch (error) {
        console.log(error)
    }
}

  const submitUpload = async (e) => {
      e.preventDefault()
      setSubmitted('uploading file...')
      try {
        const created = await client.add(file)
       setCid(created.cid.toString())
       fileUpload()

      } catch (error) {
        console.log(error)
      }
  }
  return (
    <div>
      <Button onClick={onOpen} bg="purple" color="white" ml={5}>

        Upload file
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
      >
        <ModalOverlay />
        <ModalContent>

          <ModalHeader>
            Upload your file here
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form action="" onSubmit={submitUpload}>
              <FormLabel>Name of file</FormLabel>
              <Input
                type="text"
                placeholder="Enter name of file"
                required
                mb={4}
                onChange={e => setFileName(e.target.value)}
              />
              <Input type="file" required mb={4} onChange={captureFile}/>
              <FormLabel as="view">View type</FormLabel>
              <RadioGroup defaultValue="0" mb={4} >
                <HStack spacing="24px">
                  <Radio value="0" onChange={e => setType(e.target.value)}>Public</Radio>
                  <Radio value="1" onChange={e => setType(e.target.value)}>Private</Radio>
                </HStack>
              </RadioGroup>
              <ModalFooter>
                <Text mr={2} color={'green.500'}>{submitted}</Text>
                <Button colorScheme="blue" mr={3} type='submit'>
                  Submit
                </Button>
                <Button onClick={onClose}>Cancel</Button>
              </ModalFooter>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

    </div>
  );
};

export default Upload;