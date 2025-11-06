"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp, 
  Activity, 
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Database,
  Zap
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardCard from '@/components/dashboard/DashboardCard';
import ProgressBar from '@/components/dashboard/ProgressBar';
import StatTable from '@/components/dashboard/StatTable';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  
  const {
    platformStats,
    walletStats,
    volumeStats,
    duneData,
    loading,
    error,
    lastRefresh,
    refreshData
  } = useDashboardData(selectedPeriod);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'KES' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (rate < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !platformStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NexusPay Dashboard</h1>
              <p className="text-gray-600 mt-1">Internal Platform Analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as '24h' | '7d' | '30d')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              {lastRefresh && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        {platformStats && platformStats.overview ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total Users"
              value={formatNumber(platformStats.overview.totalUsers)}
              icon={Users}
              trend={{
                value: platformStats.growth?.userGrowthRate7d || 0,
                label: "from last week",
                isPositive: (platformStats.growth?.userGrowthRate7d || 0) > 0
              }}
            />
            
            <DashboardCard
              title="Total Businesses"
              value={formatNumber(platformStats.overview.totalBusinesses)}
              icon={Building2}
              subtitle={`+${platformStats.growth?.newBusinesses7d || 0} this week`}
            />
            
            <DashboardCard
              title="Total Volume"
              value={formatCurrency(platformStats.overview.totalVolumeUSD)}
              icon={DollarSign}
              subtitle={`${formatCurrency(platformStats.overview.totalVolumeKES, 'KES')} KES`}
            />
            
            <DashboardCard
              title="Total Transactions"
              value={formatNumber(platformStats.overview.totalTransactions)}
              icon={Activity}
              trend={{
                value: platformStats.growth?.transactionGrowthRate7d || 0,
                label: "from last week",
                isPositive: (platformStats.growth?.transactionGrowthRate7d || 0) > 0
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Transaction Volume Chart */}
          {volumeStats && volumeStats.volumeStats ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Transaction Volume ({selectedPeriod})</span>
                </CardTitle>
                <CardDescription>
                  {formatCurrency(volumeStats.volumeStats.totalVolumeUSD)} total volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold">{formatNumber(volumeStats.volumeStats.totalTransactions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Transaction Size</p>
                      <p className="text-2xl font-bold">{formatCurrency(volumeStats.volumeStats.averageTransactionSizeUSD)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <StatTable
                      title="Transaction Types"
                      data={Object.entries(volumeStats.transactionTypes).map(([type, data]) => ({
                        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        value: formatCurrency(data.volumeUSD),
                        percentage: data.percentage,
                        badge: {
                          text: `${data.count} transactions`,
                          variant: 'secondary' as const
                        }
                      }))}
                      showPercentage={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Transaction Volume ({selectedPeriod})</span>
                </CardTitle>
                <CardDescription>
                  Loading volume data...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading volume statistics...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Distribution */}
          {platformStats && platformStats.wallets ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Wallet Distribution by Chain</span>
                </CardTitle>
                <CardDescription>
                  {formatNumber(platformStats.wallets.totalWallets)} total wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(platformStats.wallets.walletsByChain).map(([chain, count], index) => {
                    const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'gray'];
                    const color = colors[index % colors.length] as 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
                    
                    return (
                      <ProgressBar
                        key={chain}
                        label={chain.charAt(0).toUpperCase() + chain.slice(1)}
                        value={count}
                        total={platformStats.wallets.totalWallets}
                        color={color}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Wallet Distribution by Chain</span>
                </CardTitle>
                <CardDescription>
                  Loading wallet data...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading wallet statistics...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stellar Blockchain Highlight */}
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🌟</span>
              <span>Stellar Blockchain Integration</span>
              <Badge variant="default" className="ml-2">NEW</Badge>
            </CardTitle>
            <CardDescription>
              Fast, low-cost cross-border payments with Stellar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Supported Assets</p>
                <p className="text-2xl font-bold text-purple-600">XLM • USDC</p>
                <p className="text-xs text-gray-500 mt-2">Native Stellar assets</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Transaction Speed</p>
                <p className="text-2xl font-bold text-blue-600">3-5 sec</p>
                <p className="text-xs text-gray-500 mt-2">Ultra-fast confirmations</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Transaction Fee</p>
                <p className="text-2xl font-bold text-green-600">~$0.00001</p>
                <p className="text-xs text-gray-500 mt-2">Minimal network fees</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700">
                <strong>🎉 Now Available:</strong> Users can create Stellar wallets, buy XLM/USDC with M-Pesa, 
                send/receive payments on Stellar network, and enjoy significantly lower fees compared to EVM chains.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token Analytics */}
        {platformStats && platformStats.tokens ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Token Analytics</span>
              </CardTitle>
              <CardDescription>
                Top tokens by transaction volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platformStats.tokens.topTokensByVolume.map((token, index) => (
                  <div key={token.symbol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{token.symbol}</span>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Volume</span>
                        <span className="font-medium">{formatCurrency(token.volumeUSD)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Transactions</span>
                        <span className="font-medium">{formatNumber(token.transactionCount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Share</span>
                        <span className="font-medium">{token.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Token Analytics</span>
              </CardTitle>
              <CardDescription>
                Loading token data...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading token analytics...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Statistics */}
        {walletStats && walletStats.walletStats ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Wallet Statistics</span>
              </CardTitle>
              <CardDescription>
                Detailed wallet balance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Wallets</p>
                  <p className="text-2xl font-bold">{formatNumber(walletStats.walletStats.totalWallets)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Wallets with Balance</p>
                  <p className="text-2xl font-bold">{formatNumber(walletStats.walletStats.walletsWithBalance)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(walletStats.walletStats.totalBalanceUSD)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Average Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(walletStats.walletStats.averageBalanceUSD)}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium mb-4">Balance Distribution</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(walletStats.balanceDistribution).map(([range, count]) => (
                    <div key={range} className="text-center">
                      <p className="text-2xl font-bold">{formatNumber(count)}</p>
                      <p className="text-sm text-gray-600 capitalize">{range.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Wallet Statistics</span>
              </CardTitle>
              <CardDescription>
                Loading wallet data...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading wallet statistics...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dune Analytics Integration */}
        {duneData && duneData.metrics ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Dune Analytics Integration</span>
              </CardTitle>
              <CardDescription>
                Data formatted for external analytics platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                  title="Total Users (Dune)"
                  value={formatNumber(duneData.metrics.total_users)}
                  icon={Users}
                  badge={{ text: "Dune Format", variant: "outline" }}
                />
                <DashboardCard
                  title="Active Wallets"
                  value={formatNumber(duneData.metrics.active_wallets)}
                  icon={Wallet}
                  badge={{ text: "Dune Format", variant: "outline" }}
                />
                <DashboardCard
                  title="24h Transactions"
                  value={formatNumber(duneData.metrics.transactions_24h)}
                  icon={Activity}
                  badge={{ text: "Dune Format", variant: "outline" }}
                />
                <DashboardCard
                  title="24h Volume"
                  value={formatCurrency(duneData.metrics.volume_24h_usd)}
                  icon={DollarSign}
                  badge={{ text: "Dune Format", variant: "outline" }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Dune Analytics Integration</span>
              </CardTitle>
              <CardDescription>
                Loading Dune data...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading Dune Analytics data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>
              Platform health and data freshness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">API Status</p>
                  <p className="text-xs text-gray-600">All endpoints operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-gray-600">
                    {platformStats?.lastUpdated ? new Date(platformStats.lastUpdated).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Data Source</p>
                  <p className="text-xs text-gray-600">{platformStats?.dataSource || 'NexusPay Database'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Cache Status</p>
                  <p className="text-xs text-gray-600">Redis Active (5min TTL)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
