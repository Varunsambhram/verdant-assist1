import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wifi, 
  Power, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap
} from 'lucide-react';

const IoTDashboard = () => {
const sensorData: any[] = [];

const irrigationStatus: any[] = [];

const alerts: any[] = [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              IoT Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Monitor your farm conditions in real-time and control irrigation systems remotely.
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
<div className="text-sm text-muted-foreground">Active Sensors</div>
                    <div className="text-2xl font-bold text-foreground">{sensorData.length}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  All Online
                </Badge>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-tech rounded-lg flex items-center justify-center mr-3">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Water Usage</div>
                    <div className="text-2xl font-bold text-foreground">3,240L</div>
                  </div>
                </div>
                <div className="flex items-center text-success">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span className="text-sm">-15%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center mr-3">
                    <Thermometer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Temperature</div>
                    <div className="text-2xl font-bold text-foreground">28.8°C</div>
                  </div>
                </div>
                <div className="flex items-center text-warning">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+2.3°</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Energy Saved</div>
                    <div className="text-2xl font-bold text-foreground">156kWh</div>
                  </div>
                </div>
                <div className="flex items-center text-success">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+8%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sensor Monitoring */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Sensor Data */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Live Sensor Data</h2>
                <div className="grid gap-4">
                  {sensorData.length === 0 && (
                    <div className="text-sm text-muted-foreground">No sensors connected. Integrate your IoT backend to stream live data.</div>
                  )}
                  {sensorData.length > 0 && sensorData.map((sensor) => (
                    <div key={sensor.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                          <h3 className="font-semibold text-foreground">{sensor.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {sensor.alerts > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {sensor.alerts} Alert{sensor.alerts > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge variant="secondary">{sensor.status}</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-warning/10 rounded-full mx-auto mb-2">
                            <Thermometer className="w-4 h-4 text-warning" />
                          </div>
                          <div className="text-lg font-semibold text-foreground">{sensor.temperature}°C</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-full mx-auto mb-2">
                            <Droplets className="w-4 h-4 text-accent" />
                          </div>
                          <div className="text-lg font-semibold text-foreground">{sensor.humidity}%</div>
                          <div className="text-xs text-muted-foreground">Humidity</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full mx-auto mb-2">
                            <Gauge className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-lg font-semibold text-foreground">{sensor.soilMoisture}%</div>
                          <div className="text-xs text-muted-foreground">Soil Moisture</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-3">
                        Last updated: {sensor.lastUpdate}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Irrigation Control */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Irrigation Control</h2>
                <div className="space-y-4">
                  {irrigationStatus.length === 0 && (
                    <div className="text-sm text-muted-foreground">No irrigation zones available. Connect your controller backend.</div>
                  )}
                  {irrigationStatus.length > 0 && irrigationStatus.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          zone.status === 'active' ? 'bg-success' :
                          zone.status === 'scheduled' ? 'bg-warning' : 'bg-muted-foreground'
                        }`}></div>
                        <div>
                          <div className="font-semibold text-foreground">{zone.zone}</div>
                          <div className="text-sm text-muted-foreground">
                            {zone.status === 'active' ? `Running - ${zone.timeRemaining} remaining` :
                             zone.status === 'scheduled' ? `Scheduled in ${zone.timeRemaining}` :
                             'Manual control available'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{zone.waterFlow} L/min</div>
                          <div className="text-xs text-muted-foreground">Flow Rate</div>
                        </div>
                        <Button 
                          variant={zone.status === 'active' ? 'destructive' : 'hero'} 
                          size="sm"
                        >
                          {zone.status === 'active' ? 'Stop' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                  Recent Alerts
                </h3>
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No alerts. Connect your backend to receive alerts.</div>
                  ) : (
                    alerts.map((alert, index) => (
                      <div key={index} className="border-l-4 border-warning pl-4 py-2">
                        <div className="text-sm font-medium text-foreground">{alert.message}</div>
                        <div className="text-xs text-muted-foreground mb-2">{alert.time}</div>
                        <div className="text-xs text-accent">{alert.action}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* System Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wifi className="w-4 h-4 text-success mr-2" />
                      <span className="text-sm">Connectivity</span>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Power className="w-4 h-4 text-success mr-2" />
                      <span className="text-sm">Power Status</span>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">Normal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 text-success mr-2" />
                      <span className="text-sm">Data Sync</span>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Droplets className="w-4 h-4 mr-2" />
                    Emergency Irrigation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Power className="w-4 h-4 mr-2" />
                    System Restart
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IoTDashboard;