"use client"
import React, { createContext, useState, useContext } from 'react';

// Create a context
const RoleContext = createContext();

// Create a provider component
export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState({ name: '', email: '', contact: '', address: '' });

  // Function to update the user data
  const updateRole = (newRoleData) => {
    setRole((prevRole) => ({
      ...prevRole,
      ...newRoleData,
    }));
  };

  return (
    <RoleContext.Provider value={{ role, updateRole }}>
      {children}
    </RoleContext.Provider>
  );
};

// Custom hook to use the user context
export const useRoleContext = () => useContext(RoleContext);
