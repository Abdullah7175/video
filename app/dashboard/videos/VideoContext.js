// "use client"
// import React, { createContext, useState, useContext } from 'react';

// // Create a context
// const VideoContext = createContext();

// // Create a provider component
// export const VideoProvider = ({ children }) => {
//   const [video, setVideo] = useState({link: '' });

//   // Function to update the user data
//   const updateVideo = (newVideoData) => {
//     setVideo((prevVideo) => ({
//       ...prevVideo,
//       ...newVideoData,
//     }));
//   };

//   return (
//     <VideoContext.Provider value={{ video, updateVideo }}>
//       {children}
//     </VideoContext.Provider>
//   );
// };

// // Custom hook to use the user context
// export const useVideoContext = () => useContext(VideoContext);
"use client"
import React, { createContext, useState, useContext } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [video, setVideo] = useState({
        workRequestId: '',
        description: '',
        vid: null
    });

    const updateVideo = (newVideoData) => {
        setVideo((prevVideo) => ({
            ...prevVideo,
            ...newVideoData,
        }));
    };

    return (
        <VideoContext.Provider value={{ video, updateVideo }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideoContext = () => useContext(VideoContext);