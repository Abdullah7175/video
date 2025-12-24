import { CopyPlus } from 'lucide-react';
import AgentForm from './addAgentForm';
import { AgentProvider } from './AgentContext';

const Page = () => {
  return (
    <AgentProvider>
      <div className='bg-slate-50 p-3 h-full'>
        <div className="flex items-center justify-between bg-white mx-auto mt-10 mb-5 shadow-sm border sm:rounded-lg p-6 max-w-7xl ">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Add a New Agent</h1>
            <p className="mt-2 text-gray-600">Enter relevant details to create a new agent.</p>
          </div>
          <CopyPlus className="w-8 h-8 text-blue-950" />
        </div>
      <div className='flex flex-col items-center justify-center w-full'>
        <AgentForm />
      </div>
      </div>
    </AgentProvider>
  );
};

export default Page;
