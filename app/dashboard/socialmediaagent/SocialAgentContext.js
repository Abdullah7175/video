"use client"
import React, { createContext, useState, useContext } from 'react';

// Create a context
const SocialAgentContext = createContext();

// Create a provider component
export const SocialAgentProvider = ({ children }) => {
  const [socialagent, setSocialAgent] = useState({ name: '', email: '', contact: '', address: '' });

  // Function to update the user data
  const updateSocialAgent = (newSocialAgentData) => {
    setSocialAgent((prevSocialAgent) => ({
      ...prevSocialAgent,
      ...newSocialAgentData,
    }));
  };

  return (
    <SocialAgentContext.Provider value={{ socialagent, updateSocialAgent }}>
      {children}
    </SocialAgentContext.Provider>
  );
};

// Custom hook to use the user context
export const useSocialAgentContext = () => useContext(SocialAgentContext);
