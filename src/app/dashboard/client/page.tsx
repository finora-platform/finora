'use client'

import React from 'react';
import ClientTable from "../../../components/client-table";

export default function Client() {
  return ( 
      <div className="h-full overflow-y-auto bg-gray-50 p-8">
        <ClientTable />
      </div>
  );
}