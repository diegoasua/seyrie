import React from 'react';
import Layout from '../components/Layout';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="h-full grid grid-rows-layout">
        <div className="row-span-5 bg-blue-200 grid grid-cols-2">
          <div className="col-span-1 bg-red-200 flex items-center justify-center">
            <p className="text-2xl font-bold">First Column</p>
          </div>
          <div className="col-span-1 bg-yellow-200 flex items-center justify-center">
            <p className="text-2xl font-bold">Second Column</p>
          </div>
        </div>
        <div className="row-span-2 bg-green-200 flex items-center justify-center">
          <p className="text-2xl font-bold">Last Row</p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;