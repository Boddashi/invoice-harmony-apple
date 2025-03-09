
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import ClientList from '../components/clients/ClientList';

const Clients = () => {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <ClientList />
      </div>
    </MainLayout>
  );
};

export default Clients;
