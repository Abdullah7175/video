"use client"
import React, { createContext, useState, useContext } from 'react';

// Create a context
const SubtypeContext = createContext();

// Create a provider component
export const SubtypeProvider = ({ children }) => {
  // subtype_name,complaint_type_id,description
  const [subtype, setSubtype] = useState({ subtype_name: '', complaint_type_id: '', description: '' });

  // Function to update the user data
  const updateSubtype = (newSubtypeData) => {
    setSubtype((prevSubtype) => ({
      ...prevSubtype,
      ...newSubtypeData,
    }));
  };

  return (
    <SubtypeContext.Provider value={{ subtype, updateSubtype }}>
      {children}
    </SubtypeContext.Provider>
  );
};

// Custom hook to use the user context
export const useSubtypeContext = () => useContext(SubtypeContext);
