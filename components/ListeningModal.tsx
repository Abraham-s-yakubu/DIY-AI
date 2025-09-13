import React, { useState, useCallback } from 'react';
import type { PartIdentification } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import { CameraIcon, LinkIcon, MagnifyingGlassIcon, ShoppingCartIcon } from './icons';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

interface PartFinderInputProps {
  onSubmit: (imageBase64: string, mimeType: string) => void;
}

const PartFinderInput: React.FC<PartFinderInputProps> = ({ onSubmit }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setError(null);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); }, []);
  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid image file.');
        return;
      }
      setError(null);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFile) {
      setError('Please upload an image of the part.');
      return;
    }
    setError(null);
    try {
      const base64 = await fileToBase64(imageFile);
      onSubmit(base64, imageFile.type);
    } catch (e) {
      setError('Could not process the image file.');
    }
  };

  return (
    <div className="w-full text-left">
      <div className="flex items-center border-b border-gray-200 pb-4 mb-6">
        <MagnifyingGlassIcon className="h-7 w-7 text-green-600 mr-3" />
        <h2 className="text-3xl font-bold text-gray-800">The Part Finder</h2>
      </div>
      <p className="text-gray-600 mb-6">Upload a clear, close-up photo of the part you need to identify. Our AI will do its best to find the exact model and where to buy it.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label
          htmlFor="part-file-upload"
          className="mt-2 flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-green-500 transition-colors bg-gray-50 relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Part preview" className="h-full w-full object-contain rounded-md" />
          ) : (
            <div className="space-y-1 text-center flex flex-col items-center justify-center">
              <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600">Drag & drop an image, or click to upload</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
            </div>
          )}
          <input id="part-file-upload" name="part-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
        </label>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={!imageFile}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Identify Part
        </button>
      </form>
    </div>
  );
};


interface PartFinderResultProps {
  result: PartIdentification;
  onResetForm: () => void;
}

const PartFinderResult: React.FC<PartFinderResultProps> = ({ result, onResetForm }) => {
    return (
        <div className="w-full text-left">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-7 w-7 text-green-600 mr-3" />
                    <h2 className="text-3xl font-bold text-gray-800">Part Found!</h2>
                </div>
                <button onClick={onResetForm} className="text-sm font-medium text-blue-600 hover:underline">
                    Find another part
                </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Part Name</h3>
                    <p className="text-lg font-bold text-gray-900">{result.partName}</p>
                </div>

                {result.modelNumber && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Model / Part #</h3>
                        <p className="text-md text-gray-700 font-mono bg-gray-200 inline-block px-2 py-1 rounded">{result.modelNumber}</p>
                    </div>
                )}
                 <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</h3>
                    <p className="text-md text-gray-700">{result.description}</p>
                </div>
                
                {result.purchaseLocations && result.purchaseLocations.length > 0 && (
                     <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center mb-2">
                            <ShoppingCartIcon className="h-5 w-5 mr-2" />
                            Where to Buy
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {result.purchaseLocations.map((loc, i) => (
                                <span key={i} className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">{loc}</span>
                            ))}
                        </div>
                    </div>
                )}

                {result.installationVideo && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center mb-2">
                           <LinkIcon className="h-5 w-5 mr-2"/>
                           Installation Guide
                        </h3>
                        <a href={result.installationVideo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline break-all">
                            {result.installationVideo}
                        </a>
                    </div>
                )}

            </div>
        </div>
    );
};

interface PartFinderProps {
  onSubmit: (imageBase64: string, mimeType: string) => void;
  isLoading: boolean;
  error: string | null;
  result: PartIdentification | null;
  onResetForm: () => void;
}

const PartFinder: React.FC<PartFinderProps> = ({ onSubmit, isLoading, error, result, onResetForm }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }
  if (result) {
    return <PartFinderResult result={result} onResetForm={onResetForm} />;
  }
  return <PartFinderInput onSubmit={onSubmit} />;
};

export default PartFinder;