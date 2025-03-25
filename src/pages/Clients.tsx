
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ClientList from "../components/clients/ClientList";

const Clients = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto px-2 lg:px-0 pb-6">
        <ClientList />
      </div>
    </MainLayout>
  );
};

export default Clients;
