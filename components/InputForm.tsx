import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraIcon, VideoCameraIcon } from './icons';

interface InputFormProps {
  onSubmit: (fileBase64: string, mimeType: string, problemDescription: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const examples = [
    { name: "Leaky Faucet", text: "My kitchen sink faucet is dripping constantly from the spout, even when turned off completely." },
    { name: "Jammed Disposal", text: "My garbage disposal hums but doesn't spin when I turn it on. I think something is stuck." },
    { name: "Wobbly Fan", text: "My ceiling fan makes a rattling noise and wobbles when I turn it on high speed." },
];

type UploadMode = 'photo' | 'video';

const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up object URLs to prevent memory leaks
    return () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
    }
  }, [preview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        processFile(selectedFile);
    }
  };
  
  const processFile = (selectedFile: File) => {
    const fileType = selectedFile.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      setError(`Please select a valid ${uploadMode} file.`);
      return;
    }
    if (uploadMode === 'photo' && fileType !== 'image') {
        setError(`Please select an image file. To upload a video, switch to the Video tab.`);
        return;
    }
    if (uploadMode === 'video' && fileType !== 'video') {
        setError(`Please select a video file. To upload a photo, switch to the Photo tab.`);
        return;
    }

    setError(null);
    setFile(selectedFile);
    if (preview) {
        URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(selectedFile));
  };


  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, [uploadMode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError(`Please upload a ${uploadMode} of the problem.`);
      return;
    }
    if (!problemDescription.trim()) {
      setError('Please describe the problem.');
      return;
    }
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      onSubmit(base64, file.type, problemDescription);
    } catch (e) {
      setError('Could not process the file.');
    }
  };
  
  const handleModeChange = (mode: UploadMode) => {
      setUploadMode(mode);
      // Reset file input if mode changes
      setFile(null);
      setPreview(null);
      setError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const acceptedFileTypes = uploadMode === 'photo' ? 'image/*' : 'video/mp4,video/quicktime,video/webm';

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">1. Upload a Photo or Video</label>
                <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button type="button" onClick={() => handleModeChange('photo')} className={`${uploadMode === 'photo' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                           <CameraIcon className="inline-block h-5 w-5 mr-2" /> Photo
                        </button>
                        <button type="button" onClick={() => handleModeChange('video')} className={`${uploadMode === 'video' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                           <VideoCameraIcon className="inline-block h-5 w-5 mr-2" /> Video
                        </button>
                    </nav>
                </div>
                <label 
                  htmlFor="file-upload" 
                  className="mt-2 flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 relative"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    uploadMode === 'photo' ? (
                       <img src={preview} alt="Problem preview" className="h-full w-full object-contain rounded-md" />
                    ) : (
                       <video src={preview} controls muted className="h-full w-full object-contain rounded-md" />
                    )
                  ) : (
                    <div className="space-y-1 text-center flex flex-col items-center justify-center">
                      {uploadMode === 'photo' ? <CameraIcon className="mx-auto h-12 w-12 text-gray-400" /> : <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />}
                      <div className="flex text-sm text-gray-600">
                        <p className="pl-1">Drag & drop a {uploadMode}, or click to upload</p>
                      </div>
                      <p className="text-xs text-gray-500">{uploadMode === 'photo' ? 'PNG, JPG, GIF' : 'MP4, MOV, WebM (5-10s recommended)'}</p>
                    </div>
                  )}
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFileTypes} ref={fileInputRef} />
                </label>
            </div>


          <div>
            <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">2. Describe the Problem</label>
            <div className="mt-1">
              <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400"
                  placeholder="e.g., 'My kitchen sink is leaking...'"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
              />
            </div>
          </div>
          
          <div className="text-sm">
              <span className="text-gray-500 mr-2">Try an example:</span>
              <div className="inline-flex gap-2 flex-wrap">
                  {examples.map((ex) => (
                      <button 
                          key={ex.name} 
                          type="button" 
                          onClick={() => setProblemDescription(ex.text)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50"
                      >
                          {ex.name}
                      </button>
                  ))}
              </div>
          </div>
          
          {error && <p className="text-sm text-red-600 text-center py-2">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={!file || !problemDescription}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Get Fix-It Plan
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default InputForm;
