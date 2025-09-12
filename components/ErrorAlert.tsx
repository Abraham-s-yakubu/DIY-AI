import React from 'react';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="bg-red-50 p-6 rounded-lg text-center" role="alert">
      <h3 className="text-lg font-medium text-red-800">Oops! Something went wrong.</h3>
      <div className="mt-2 text-sm text-red-700">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ErrorAlert;