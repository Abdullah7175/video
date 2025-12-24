"use client"
import React, { createContext, useState, useContext } from 'react';

// Create a context
const TypeContext = createContext();

// Create a provider component
export const TypeProvider = ({ children }) => {
  const [type, setAgent] = useState({ type_name: '', description: ''});

  // Function to update the user data
  const updateType = (newTypeData) => {
    setAgent((prevType) => ({
      ...prevType,
      ...newTypeData,
    }));
  };

  return (
    <TypeContext.Provider value={{ type, updateType }}>
      {children}
    </TypeContext.Provider>
  );
};

// Custom hook to use the user context
export const useTypeContext = () => useContext(TypeContext);
