import React from 'react'
import ReactLoading from "react-loading";
import { saveAs } from "file-saver";
import axios from 'axios'

import {
	MultipleFileUpload,
	MultipleFileUploadMain,
	MultipleFileUploadStatus,
	MultipleFileUploadStatusItem,
	Button
} from '@patternfly/react-core'

import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon'

import "@patternfly/react-core/dist/styles/base.css"

import '../assets/css/FileUploader.css'

import styled from 'styled-components'

const Wrapper = styled.div`
	width: 100%;
	`

const Container = styled.div`
	width: 100%;
	height: 98vh;
	display: flex;
	flex-wrap : nowrap;

	.btn-container {
		display: flex;
		align-items: center;
		justify-content: center;
		border-right: 1px dashed #06c;

		.btn-merge {
			paddding: 20px;
			transition: all .2s ease-in-out; 
			&:hover {
				transform: scale(1.5)
			}
		}
	}
	`
	
const Block = styled.div`
	width: 50%;

	&.pdf-upload-area {
		overflow-y: scroll;
		padding: 16px;
	}

	
	&.pdf-preview-area {
		embed {
			height: 100%;
		}
		.preview-notification {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;

			h3 {
				font-size: 30px;
				font-weight: bold
			}
		}
	}
	`

const FilesUploadComponent = () => {
	const [currentFiles, setCurrentFiles] = React.useState([])
	const [readFileData, setReadFileData] = React.useState([])
	const [showStatus, setShowStatus] = React.useState(false)
	const [statusIcon, setStatusIcon] = React.useState('inProgress')
	const [mergedFileUrl, setMergedFileUrl] = React.useState('')

	const [successfullyReadFileCount, setSuccessfullyReadFileCount] = React.useState(-1)
	const [isReadyFiles, setReadyFiles] = React.useState(false)
	const [isMerging, setMerging] = React.useState(false)

	if (!showStatus && currentFiles.length > 0) {
		setShowStatus(true)
	}
	
	React.useEffect(() => {
		if (readFileData.length < currentFiles.length) {
			setStatusIcon('inProgress');
		} else if (readFileData.every(file => file.loadResult === 'success')) {
			setStatusIcon('success');
		} else {
			setStatusIcon('danger');
		}
	}, [readFileData, currentFiles]);

	// remove files from both state arrays based on their name
	const removeFiles = (namesOfFilesToRemove) => {
		const newCurrentFiles = currentFiles.filter(
		  currentFile => !namesOfFilesToRemove.some(fileName => fileName === currentFile.name)
		);
	
		setCurrentFiles(newCurrentFiles);
	
		const newReadFiles = readFileData.filter(
		  readFile => !namesOfFilesToRemove.some(fileName => fileName === readFile.fileName)
		);
	
		setReadFileData(newReadFiles);
	};
	
	// callback that will be called by the react dropzone with the newly dropped file objects
	const handleFileDrop = (droppedFiles) => {

		// identify what, if any, files are re-uploads of already uploaded files
		const currentFileNames = currentFiles.map(file => file.name);
		const reUploads = droppedFiles.filter(droppedFile => currentFileNames.includes(droppedFile.name));

		Promise.resolve()
		.then(() => removeFiles(reUploads.map(file => file.name)))
		.then(() => setCurrentFiles(prevFiles => [...prevFiles, ...droppedFiles]));
		
		/** this promise chain is needed because if the file removal is done at the same time as the file adding react
		 * won't realize that the status items for the re-uploaded files needs to be re-rendered */
	};

	React.useEffect(()=>{
		setSuccessfullyReadFileCount(readFileData.filter(fileData => fileData.loadResult === 'success').length);
		if(successfullyReadFileCount === currentFiles.length) {
			setReadyFiles(true) 
		}
	}, [readFileData])

	// React.useEffect(() => {
	// }, [readFileData])
	
	// callback called by the status item when a file is successfully read with the built-in file reader
	const handleReadSuccess = (data, file) => {
		setReadFileData(prevReadFiles => [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }]);
	};
	
	// callback called by the status item when a file encounters an error while being read with the built-in file reader
	const handleReadFail = (error, file) => {
		setReadFileData(prevReadFiles => [
		  ...prevReadFiles,
		  { loadError: error, fileName: file.name, loadResult: 'danger' }
		]);
	};

	const onSubmit = () => {
		setMerging(true)

		const formData = new FormData();

		currentFiles.map(file => {
			formData.append('file', file)
		})
		
		axios
			.post("http://localhost:4000/api/mergepdf", formData, {})
			.then(res => {
				console.log(res.data.downloadUrl)
				setMergedFileUrl(res.data.downloadUrl)
				// saveAs(res.data.downloadUrl, 'Download')
				setMerging(false)
			})
			.catch(err => {
				console.log(err) 
				setMerging(false)
			})
	}
	
	
	return (
		<Wrapper>
			<Container>
				<Block className='pdf-upload-area'>
					<MultipleFileUpload
						onFileDrop={handleFileDrop}
						dropzoneProps={{
						accept: 'application/pdf'
						}}
					>
						<MultipleFileUploadMain
						titleIcon={<UploadIcon />}
						titleText="Drag and drop files here"
						titleTextSeparator="or"
						infoText="Accepted file types: PDF"
						/>
						{showStatus && (
						<MultipleFileUploadStatus
							statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files readed`}
							statusToggleIcon={statusIcon}
						>
							{currentFiles.map(file => (
							<MultipleFileUploadStatusItem
								file={file}
								key={file.name}
								onClearClick={() => removeFiles([file.name])}
								onReadSuccess={handleReadSuccess}
								onReadFail={handleReadFail}
							/>
							))}
						</MultipleFileUploadStatus>
						)}
					</MultipleFileUpload>
				</Block>
				{/* 
				<button>Merge</button> */}
				{isReadyFiles && 
					<div className="btn-container">
						<Button className="btn-merge" variant="link" isLarge onClick={onSubmit} disabled={isMerging}>
							&#62;&#62;
						</Button>
					</div>
				}

				<Block className='pdf-preview-area'>
					{!mergedFileUrl && !isMerging && 
						<div className='preview-notification'>
							<h3>Please upload pdfs to get merged one.</h3> 
						</div>
					}
					{mergedFileUrl && !isMerging && <embed src={mergedFileUrl} width="100%" height="100%"/>}
					{isMerging && <div className='preview-notification'><ReactLoading type='spinningBubbles' color='#000'/></div>}
				</Block>
			</Container>
		</Wrapper>
	  );
	};
	
export default FilesUploadComponent
