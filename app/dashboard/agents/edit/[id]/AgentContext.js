"use client"
import React, { createContext, useState, useContext } from 'react';

// Create a context
const AgentContext = createContext();

// Create a provider component
export const AgentProvider = ({ children }) => {
  const [agent, setAgent] = useState({ name: '', designation: '', contact: '', address: '', department: '',email: '' });

  // Function to update the user data
  const updateAgent = (newAgentData) => {
    setAgent((prevAgent) => ({
      ...prevAgent,
      ...newAgentData,
    }));
  };

  return (
    <AgentContext.Provider value={{ agent, updateAgent }}>
      {children}
    </AgentContext.Provider>
  );
};

// Custom hook to use the user context
export const useAgentContext = () => useContext(AgentContext);
