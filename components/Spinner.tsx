
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" xmlns="http://www.w3.org/2000/svg" className="text-sky-500">
        <circle cx="6" cy="12" r="6" fill="currentColor">
            <animate attributeName="r"
                 values="6;3;6"
                 begin="0s" dur="1.5s"
                 repeatCount="indefinite" />
            <animate attributeName="fill-opacity"
                values="1;0.5;1"
                begin="0s" dur="1.5s"
                repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="12" r="6" fill="currentColor">
            <animate attributeName="r"
                 values="6;3;6"
                 begin="0.2s" dur="1.5s"
                 repeatCount="indefinite" />
            <animate attributeName="fill-opacity"
                values="1;0.5;1"
                begin="0.2s" dur="1.5s"
                repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="12" r="6" fill="currentColor">
            <animate attributeName="r"
                 values="6;3;6"
                 begin="0.4s" dur="1.5s"
                 repeatCount="indefinite" />
            <animate attributeName="fill-opacity"
                values="1;0.5;1"
                begin="0.4s" dur="1.5s"
                repeatCount="indefinite" />
        </circle>
    </svg>
  );
};

export default Spinner;