'use client'

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { FilterProvider } from "@/contexts/filter-context"
import { FilterBar } from '@/components/ui/filter-bar';
import { ActiveClientsChart } from "@/components/charts/active-clients-chart"
import { ComplianceScoreChart } from "@/components/charts/compliance-score-chart"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { EmployeeTargetsChart } from "@/components/charts/employee-targets-chart"
import { TradeAccuracyChart } from "@/components/charts/trade-accuracy-chart"
import { ClientAcquisitionChart } from "@/components/charts/client-acquisition-chart"
import { activeClientsData, complianceAreas, revenueData, employeeTargetsData, clientAcquisitionData } from '@/lib/dummydata';

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      {user && (
        <FilterProvider>
          <>
            <div className="max-h-screen overflow-y-auto bg-gray-50 p-8">
              <div className="mx-auto max-w-7xl">
                <h1 className="text-4xl font-bold mb-4">Hi {user.firstName}!</h1>
                {/* <p className="text-gray-500 mb-4">Your business at a glance</p> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <ActiveClientsChart data={activeClientsData} total={865} />
                  <ComplianceScoreChart score={58} areas={complianceAreas} />
                </div>

                <FilterBar />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  <RevenueChart data={revenueData} total={23345} percentageChange={2.4} />
                  <EmployeeTargetsChart data={employeeTargetsData} totalPercentage={82} percentageChange={0.4} />
                  <TradeAccuracyChart percentage={42} completedTrades={38} percentageChange={2.4} />
                  <ClientAcquisitionChart data={clientAcquisitionData} total={25} percentageChange={9.4} />
                </div>
              </div>
            </div>
          </>
        </FilterProvider>
      )}
    </div>
  );
}