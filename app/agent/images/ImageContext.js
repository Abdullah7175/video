"use client"
import React, { createContext, useState, useContext } from 'react';

const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
    const [image, setImage] = useState({
        workRequestId: '',
        description: '',
        img: null
    });

    const updateImage = (newImageData) => {
        setImage((prevImage) => ({
            ...prevImage,
            ...newImageData,
        }));
    };

    return (
        <ImageContext.Provider value={{ image, updateImage }}>
            {children}
        </ImageContext.Provider>
    );
};

export const useImageContext = () => useContext(ImageContext);